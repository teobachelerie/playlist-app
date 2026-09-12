"use client";

import { useEffect, useRef, useState } from "react";
import { parseLrc, activeLineIndex, type LyricLine, type WordTiming } from "@/lib/lrc";

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
    <span className="relative inline-block mr-[0.3em]">
      <span className="text-muted">{text}</span>
      <span
        className="absolute inset-0 overflow-hidden text-text whitespace-nowrap"
        style={{ width: overlayWidth, transition }}
      >
        {text}
      </span>
    </span>
  );
}

export default function Lyrics({
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

  const idx = activeLineIndex(lines, currentTime);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const activeLine = lineRefs.current[idx];
    if (!container || !activeLine) return;
    const containerHeight = container.clientHeight;
    const target = containerHeight / 2 - (activeLine.offsetTop + activeLine.offsetHeight / 2);
    setOffset(target);
  }, [idx, lines.length]);

  if (!lyricsUrl) {
    return <p className="text-muted text-sm">Pas de paroles trouvées pour ce titre.</p>;
  }

  if (lines.length === 0) {
    return <p className="text-muted text-sm">Chargement des paroles…</p>;
  }

  return (
    <div ref={containerRef} className="h-64 overflow-hidden relative">
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className="space-y-3"
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
              className={`cursor-pointer text-lg leading-snug transition-opacity duration-500 ${
                active ? "opacity-100" : "opacity-60 hover:opacity-90"
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
                      currentTime={currentTime}
                    />
                  );
                })
              ) : (
                <span className={active ? "text-text" : "text-muted"}>{line.text}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
