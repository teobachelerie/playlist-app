"use client";

import { memo, type CSSProperties } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Airplay } from "lucide-react";
import type { Track } from "@/lib/playlist";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CompactPlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  playbackError,
  shuffle,
  repeat,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onSeek,
  airplaySupported,
  onAirplay,
}: {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackError: boolean;
  shuffle: boolean;
  repeat: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onSeek: (time: number) => void;
  airplaySupported: boolean;
  onAirplay: () => void;
}) {
  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed z-40" style={{ left: "var(--edge)", right: "var(--edge)", bottom: "var(--edge)" }}>
      <div
        className="verre-liquide rounded-t-[var(--radius-frame-top)] rounded-b-[var(--radius-frame)] px-5 pt-4"
        // Dégage la barre d'accueil, qui passe sur le bas du lecteur.
        style={{ paddingBottom: "max(12px, calc(env(safe-area-inset-bottom) - 12px))" }}
      >
        <div className="flex items-center gap-3">
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="pochette w-12 h-12 rounded-sm object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-sm bg-inset shrink-0" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body titre-encre">{track.title}</span>
            <span className="block truncate text-footnote text-tertiary leading-tight">
              {playbackError ? "Lecture impossible — passe au suivant" : track.artist}
            </span>
          </span>
          {airplaySupported && (
            <button onClick={onAirplay} className="p-2 shrink-0 text-tertiary" aria-label="Sortie audio">
              <Airplay size={20} />
            </button>
          )}
        </div>

        <div className="mt-3 space-y-0.5">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            step={0.1}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            style={{ "--progress": `${pct}%` } as CSSProperties}
            className="progress-range w-full"
            aria-label="Progression du titre"
          />
          <div className="flex justify-between text-caption text-tertiary tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(duration - currentTime, 0))}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-7 mt-2">
          <button
            onClick={onToggleShuffle}
            className={shuffle ? "actif-point" : "text-tertiary"}
            aria-pressed={shuffle}
            aria-label="Lecture aléatoire"
          >
            <Shuffle size={18} />
          </button>
          <button onClick={onPrevious} className="press-tactile text-text active:opacity-[0.55]" aria-label="Titre précédent">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="press-tactile btn-encre w-11 h-11 flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button onClick={onNext} className="press-tactile text-text active:opacity-[0.55]" aria-label="Titre suivant">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button
            onClick={onToggleRepeat}
            className={repeat ? "actif-point" : "text-tertiary"}
            aria-pressed={repeat}
            aria-label="Répéter"
          >
            <Repeat size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(CompactPlayer);
