// Miroir de lib/lrc.ts en JS pur — le script d'ingestion tourne en Node ESM
// et ne peut pas importer directement un fichier .ts du projet Next.
// Si tu modifies la logique de parsing dans lib/lrc.ts, reporte le changement ici.

export function parseLrc(raw) {
  const lines = [];
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
