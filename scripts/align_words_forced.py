#!/usr/bin/env python3
"""
Alignement forcé du texte OFFICIEL des paroles sur l'audio, via WhisperX
(modèle phonétique CTC dédié à ce calage), plutôt que de deviner ce qui est
chanté (Whisper classique) puis recaler approximativement sur les paroles
officielles — c'est cette étape de recalage approximatif qui causait la
plupart des mots sautés ou mal placés dans la version précédente.

Reçoit :
  argv[1] : chemin du mp3
  argv[2] : chemin d'un fichier JSON contenant les segments
            [{"text": "paroles de la ligne", "start": ..., "end": ...}, ...]
            (un segment par ligne de paroles, bornes issues du fichier LRC)

Écrit sur stdout un tableau JSON [{"lineIndex": i, "text": mot, "time": t}, ...]
— un mot pour chaque mot du texte officiel de la ligne, dans l'ordre.

Limite connue : le modèle d'alignement est entraîné sur de la parole, pas du
chant, et on aligne le mix complet (voix + instruments), pas une piste vocale
isolée — la précision peut rester imparfaite sur des passages très chantés
ou avec beaucoup d'instrumentation.
"""
import sys
import json


def main():
    if len(sys.argv) != 3:
        print("Usage: align_words_forced.py <mp3> <segments.json>", file=sys.stderr)
        sys.exit(1)

    mp3_path = sys.argv[1]
    segments_path = sys.argv[2]

    with open(segments_path, "r", encoding="utf-8") as f:
        raw_segments = json.load(f)

    import whisperx

    device = "cpu"
    audio = whisperx.load_audio(mp3_path)

    segments = [
        {"text": s["text"], "start": s["start"], "end": s["end"]}
        for s in raw_segments
        if s["text"].strip()
    ]

    model_a, metadata = whisperx.load_align_model(language_code="en", device=device)
    aligned = whisperx.align(
        segments, model_a, metadata, audio, device, return_char_alignments=False
    )

    output = []
    for seg_idx, segment in enumerate(aligned.get("segments", [])):
        official_words = segments[seg_idx]["text"].split()
        aligned_words = segment.get("words", [])

        # WhisperX renvoie normalement un mot aligné pour chaque mot du texte
        # donné, mais peut en laisser sans "start" si l'alignement a échoué
        # dessus (bruit, mot avalé...) — on comble par interpolation locale
        # entre les mots voisins qui ont un vrai timing, plutôt que de le
        # perdre ou de tout étirer sur le segment entier.
        times = [w.get("start") for w in aligned_words]
        for i, t in enumerate(times):
            if t is not None:
                continue
            prev_i = next((j for j in range(i - 1, -1, -1) if times[j] is not None), None)
            next_i = next((j for j in range(i + 1, len(times)) if times[j] is not None), None)
            prev_t = times[prev_i] if prev_i is not None else segments[seg_idx]["start"]
            next_t = times[next_i] if next_i is not None else segments[seg_idx]["end"]
            span = (next_i if next_i is not None else len(times)) - (prev_i if prev_i is not None else -1)
            step = (i - (prev_i if prev_i is not None else -1)) / span if span else 0
            times[i] = prev_t + (next_t - prev_t) * step

        # Nombre de mots alignés différent du texte officiel (rare, mais
        # possible) : on retombe sur une répartition linéaire dans le
        # segment plutôt que de désynchroniser le reste de la ligne.
        if len(times) != len(official_words):
            start, end = segments[seg_idx]["start"], segments[seg_idx]["end"]
            n = len(official_words)
            times = [start + (end - start) * (i / n) for i in range(n)]

        for word_text, t in zip(official_words, times):
            output.append({"lineIndex": seg_idx, "text": word_text, "time": round(t, 2)})

    json.dump(output, sys.stdout)


if __name__ == "__main__":
    main()
