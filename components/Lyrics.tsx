"use client";

import { memo, useEffect, useRef, useState } from "react";
import { parseLrc, activeLineIndex, type LyricLine, type WordTiming } from "@/lib/lrc";

// Whisper (et le pipeline d'alignement) a tendance à détecter les mots avec
// un léger retard systématique par rapport au son réel — cette compensation
// avance artificiellement le temps utilisé pour le surlignage. À ajuster
// si le décalage ressenti persiste (en secondes).
const LEAD_OFFSET = 0.18;

function Word({
  text,
  time,
  duration,
  currentTime,
}: {
  text: string;
  time: number;
  duration: number;
  currentTime: number;
}) {
  // Trois états : pas encore prononcé (gris), en train d'être prononcé
  // (fondu gris -> blanc animé sur la durée réelle du mot), déjà prononcé
  // (blanc, sans animation pour éviter de rejouer le fondu à chaque rendu).
  let overlayWidth = "0%";
  let transition = "none";

  if (currentTime >= time + duration) {
    overlayWidth = "100%";
  } else if (currentTime >= time) {
    overlayWidth = "100%";
    transition = `width ${duration}s linear`;
  }

  return (
    <span className="relative inline-block mr-[0.25em]">
      <span className="text-tertiary">{text}</span>
      <span
        className="absolute inset-0 overflow-hidden text-text whitespace-nowrap"
        style={{ width: overlayWidth, transition }}
      >
        {text}
      </span>
    </span>
  );
}

function Lyrics({
  lyricsUrl,
  wordsUrl,
  currentTime,
  onSeek,
}: {
  lyricsUrl: string | null;
  wordsUrl: string | null;
  currentTime: number;
  onSeek: (time: number) => void;
}) {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [words, setWords] = useState<WordTiming[]>([]);

  useEffect(() => {
    setLines([]);
    setWords([]);
    if (!lyricsUrl) return;
    let cancelled = false;

    fetch(lyricsUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then((raw) => {
        if (!cancelled) setLines(parseLrc(raw));
      })
      .catch(() => {
        if (!cancelled) setLines([]);
      });

    if (wordsUrl) {
      fetch(wordsUrl)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data: WordTiming[]) => {
          if (!cancelled) setWords(data);
        })
        .catch(() => {
          if (!cancelled) setWords([]);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [lyricsUrl, wordsUrl]);

  const idx = activeLineIndex(lines, currentTime + LEAD_OFFSET);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Défilement automatique vers la ligne active — seulement quand la ligne
  // change (pas à chaque tick de lecture), pour laisser la place à un
  // balayage manuel entre-temps sans que ça se batte avec l'utilisateur.
  useEffect(() => {
    lineRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [idx]);

  if (!lyricsUrl) {
    return <p className="text-muted text-sm">Pas de paroles trouvées pour ce titre.</p>;
  }

  if (lines.length === 0) {
    return <p className="text-muted text-sm">Chargement des paroles…</p>;
  }

  return (
    <div
      className="h-full overflow-y-auto py-24 space-y-6"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
      }}
    >
      {lines.map((line, i) => {
        const lineWords = words.filter((w) => w.lineIndex === i);
        const active = i === idx;

        return (
          <div
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            onClick={() => onSeek(lineWords[0]?.time ?? line.time)}
            className={`cursor-pointer text-3xl font-bold leading-tight transition-opacity duration-500 ${
              active ? "opacity-100" : "opacity-35"
            }`}
          >
            {lineWords.length > 0 ? (
              lineWords.map((w, j) => {
                const next = lineWords[j + 1];
                const nextLineStart = lines[i + 1]?.time ?? w.time + 3;
                const duration = Math.max(0.1, (next ? next.time : nextLineStart) - w.time);
                return (
                  <Word
                    key={j}
                    text={w.text}
                    time={w.time}
                    duration={duration}
                    currentTime={currentTime + LEAD_OFFSET}
                  />
                );
              })
            ) : (
              <span className="text-text">{line.text}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(Lyrics);
