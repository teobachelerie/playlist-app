#!/usr/bin/env python3
"""
Transcrit l'audio avec faster-whisper et renvoie, en JSON sur stdout, la liste
des mots détectés avec leurs instants de prononciation réels.

Important : le TEXTE affiché dans l'app vient des paroles officielles
(lrclib), pas de la transcription Whisper — Whisper peut se tromper sur des
mots (accents, argot, langues étrangères). Ce script ne sert qu'à récupérer
des instants réels de prononciation pour caler l'animation ; le mapping avec
les paroles officielles est fait côté Node (scripts/lib/alignWords.mjs).

Le modèle est téléchargé une seule fois (mis en cache par
faster-whisper / huggingface_hub, généralement dans ~/.cache/huggingface)
puis réutilisé pour tous les titres suivants sans nouveau téléchargement.
"""
import sys
import json


def main():
    if len(sys.argv) != 2:
        print("Usage: align_words.py <chemin_mp3>", file=sys.stderr)
        sys.exit(1)

    mp3_path = sys.argv[1]

    from faster_whisper import WhisperModel

    # "small" + int8 : compromis correct vitesse/précision sur CPU, sans GPU.
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(mp3_path, word_timestamps=True)

    words = []
    for segment in segments:
        for word in segment.words or []:
            words.append({"start": round(word.start, 3), "end": round(word.end, 3)})

    json.dump(words, sys.stdout)


if __name__ == "__main__":
    main()
