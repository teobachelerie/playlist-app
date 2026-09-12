export type LyricLine = {
  time: number; // secondes
  text: string;
};

export type WordTiming = {
  lineIndex: number;
  text: string;
  time: number; // secondes — instant où le mot doit passer en surbrillance
};

// Parse un fichier .lrc standard : lignes du type "[mm:ss.xx]texte"
// Une ligne peut porter plusieurs timestamps ("[00:12.00][00:45.00]texte") — rare mais géré.
export function parseLrc(raw: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeTag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/g;

  for (const rawLine of raw.split(/\r?\n/)) {
    const tags = [...rawLine.matchAll(timeTag)];
    if (tags.length === 0) continue;

    const text = rawLine.replace(timeTag, "").trim();
    if (!text) continue;

    for (const tag of tags) {
      const minutes = parseInt(tag[1], 10);
      const seconds = parseInt(tag[2], 10);
      const centis = tag[3] ? parseInt(tag[3].padEnd(2, "0"), 10) : 0;
      const time = minutes * 60 + seconds + centis / 100;
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

// Renvoie l'index de la ligne active pour un instant donné (recherche linéaire —
// largement suffisant pour des paroles de quelques dizaines de lignes).
export function activeLineIndex(lines: LyricLine[], currentTime: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}
