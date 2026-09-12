// Conversion WebVTT (sous-titres YouTube) -> LRC.
// Fallback utilisé seulement si lrclib.net n'a rien trouvé pour le titre.
// Qualité variable : fiable pour des sous-titres manuels avec les vraies paroles,
// approximative pour des sous-titres auto-générés (reconnaissance vocale du chant).

function vttTimeToSeconds(vttTime) {
  // format "00:01:23.456" ou "01:23.456"
  const parts = vttTime.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  const [m, s] = parts;
  return m * 60 + s;
}

function secondsToLrcTag(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `[${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}]`;
}

export function vttToLrc(vttContent) {
  const lines = vttContent.split(/\r?\n/);
  const cueTimeRe = /(\d{2}:)?\d{2}:\d{2}\.\d{3}\s*-->\s*(\d{2}:)?\d{2}:\d{2}\.\d{3}/;

  const lrcLines = [];
  let pendingTime = null;
  let lastText = ""; // évite les doublons consécutifs fréquents dans les auto-subs

  for (const line of lines) {
    const cueMatch = line.match(cueTimeRe);
    if (cueMatch) {
      const start = cueMatch[0].split("-->")[0].trim();
      pendingTime = vttTimeToSeconds(start);
      continue;
    }

    if (pendingTime === null) continue;
    const text = line.replace(/<[^>]+>/g, "").trim(); // retire les balises de style éventuelles
    if (!text || text === lastText) continue;

    lrcLines.push(`${secondsToLrcTag(pendingTime)}${text}`);
    lastText = text;
    pendingTime = null;
  }

  return lrcLines.join("\n");
}
