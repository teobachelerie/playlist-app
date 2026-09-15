// Combine les paroles officielles (texte fiable, timing par ligne seulement)
// avec les instants de prononciation détectés par Whisper (timing précis,
// mais texte pas toujours fiable) pour produire un timing par mot.
//
// Principe : pour chaque ligne, on prend la fenêtre de temps [début de la
// ligne, début de la ligne suivante[, on regarde combien de mots Whisper y a
// détecté, et on répartit les mots officiels de la ligne sur ces instants
// réels (proportionnellement, si le nombre de mots ne correspond pas
// exactement — cas fréquent : Whisper loupe des mots chantés ou en fusionne).
//
// Si Whisper n'a rien détecté dans la fenêtre (silence, voix trop faible,
// VAD trop strict), on retombe sur une répartition linéaire dans la ligne —
// moins précis, mais jamais pire que l'ancien comportement (surlignage ligne
// entière).
export function assignWordTimes(lines, whisperStarts, totalDuration) {
  const sortedStarts = [...whisperStarts].sort((a, b) => a - b);
  const result = [];

  // Rythme de parole/chant maximum plausible (mots/seconde) — sert à borner
  // la fenêtre de repli pour ne pas étirer une ligne courte sur tout le
  // silence qui la sépare de la ligne suivante.
  const MAX_WORDS_PER_SECOND = 2.5;

  for (let i = 0; i < lines.length; i++) {
    const lineStart = lines[i].time;
    const rawLineEnd = i + 1 < lines.length ? lines[i + 1].time : totalDuration;
    const words = lines[i].text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    const windowStarts = sortedStarts.filter((t) => t >= lineStart && t < rawLineEnd);
    // Si Whisper a détecté des mots dans la fenêtre brute, on la garde telle
    // quelle (les instants réels bornent déjà correctement). Sinon, on ne
    // remonte pas jusqu'à la ligne suivante : on utilise la durée qu'il
    // faudrait réalistement pour prononcer ces mots, jamais plus.
    const estimatedDuration = words.length / MAX_WORDS_PER_SECOND;
    const lineEnd =
      windowStarts.length > 0 ? rawLineEnd : Math.min(rawLineEnd, lineStart + estimatedDuration);

    for (let j = 0; j < words.length; j++) {
      let time;
      if (windowStarts.length > 0) {
        const idx = Math.min(
          windowStarts.length - 1,
          Math.floor((j * windowStarts.length) / words.length)
        );
        time = windowStarts[idx];
      } else {
        time = lineStart + (j * (lineEnd - lineStart)) / words.length;
      }
      result.push({
        lineIndex: i,
        text: words[j],
        time: Math.round(time * 100) / 100,
      });
    }
  }

  return result;
}
