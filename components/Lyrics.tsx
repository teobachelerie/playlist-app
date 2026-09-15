"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { parseLrc, activeLineIndex, type LyricLine, type WordTiming } from "@/lib/lrc";

// Whisper (et le pipeline d'alignement) a tendance à détecter les mots avec
// un léger retard systématique par rapport au son réel — cette compensation
// avance artificiellement le temps utilisé pour le surlignage. Valeur reduite
// suite à retour : trop d'avance déclenchait le mot avant qu'il soit chanté.
const LEAD_OFFSET = 0.05;

type WordWithDuration = WordTiming & { duration: number };

// Mot de la ligne EN COURS uniquement — reçoit le temps en direct et anime
// son propre fondu. Les autres lignes n'ont pas besoin de ça (voir StaticWord).
function AnimatedWord({ text, time, duration, currentTime }: WordWithDuration & { currentTime: number }) {
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

// Mot d'une ligne passée ou à venir — état figé (entièrement chanté ou pas
// encore), aucun calcul lié à currentTime, donc jamais re-rendu à chaque frame.
function StaticWord({ text, done }: { text: string; done: boolean }) {
  return <span className={`mr-[0.25em] ${done ? "text-text" : "text-tertiary"}`}>{text}</span>;
}

const StaticLine = memo(function StaticLine({
  words,
  fallbackText,
  done,
  onClick,
}: {
  words: string[];
  fallbackText: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="cursor-pointer text-3xl font-bold leading-tight opacity-35 w-full flex flex-wrap">
      {words.length > 0 ? (
        words.map((w, j) => <StaticWord key={j} text={w} done={done} />)
      ) : (
        <span className={done ? "text-text" : "text-tertiary"}>{fallbackText}</span>
      )}
    </div>
  );
});

function ActiveLine({
  words,
  fallbackText,
  currentTime,
  onClick,
}: {
  words: WordWithDuration[];
  fallbackText: string;
  currentTime: number;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="cursor-pointer text-3xl font-bold leading-tight opacity-100 w-full flex flex-wrap">
      {words.length > 0 ? (
        words.map((w, j) => <AnimatedWord key={j} {...w} currentTime={currentTime} />)
      ) : (
        <span className="text-text">{fallbackText}</span>
      )}
    </div>
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

  // Regroupement mots-par-ligne + durée de chaque mot calculés une seule
  // fois (pas à chaque frame) — c'était le vrai coût qui causait les à-coups.
  // Durée plafonnée : sans ça, le dernier mot d'une ligne "hérite" du silence
  // avant la ligne suivante et son fondu traîne bien après avoir été chanté.
  const MAX_WORD_DURATION = 0.6;
  const wordsByLine = useMemo(() => {
    const groups: WordWithDuration[][] = lines.map(() => []);
    for (let i = 0; i < lines.length; i++) {
      const lineWords = words.filter((w) => w.lineIndex === i);
      const nextLineStart = lines[i + 1]?.time ?? (lineWords[lineWords.length - 1]?.time ?? 0) + 3;
      groups[i] = lineWords.map((w, j) => {
        const next = lineWords[j + 1];
        const duration = Math.min(
          MAX_WORD_DURATION,
          Math.max(0.1, (next ? next.time : nextLineStart) - w.time)
        );
        return { ...w, duration };
      });
    }
    return groups;
  }, [lines, words]);

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
        const lineWords = wordsByLine[i] ?? [];
        const active = i === idx;

        return (
          <div
            key={i}
            className="w-full"
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
          >
            {active ? (
              <ActiveLine
                words={lineWords}
                fallbackText={line.text}
                currentTime={currentTime + LEAD_OFFSET}
                onClick={() => onSeek(lineWords[0]?.time ?? line.time)}
              />
            ) : (
              <StaticLine
                words={lineWords.map((w) => w.text)}
                fallbackText={line.text}
                done={i < idx}
                onClick={() => onSeek(lineWords[0]?.time ?? line.time)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(Lyrics);
