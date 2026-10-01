"use client";

import { memo, useState, type CSSProperties } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Airplay,
  ListMusic,
} from "lucide-react";
import type { Track } from "@/lib/playlist";
import Queue from "@/components/Queue";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CompactPlayer({
  track,
  queue,
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
  onSelectFromQueue,
  airplaySupported,
  onAirplay,
}: {
  track: Track;
  queue: Track[];
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
  onSelectFromQueue: (id: string) => void;
  airplaySupported: boolean;
  onAirplay: () => void;
}) {
  const [showQueue, setShowQueue] = useState(false);
  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40">
      {showQueue && (
        <div className="mb-2 bg-surface shadow-raised-lg rounded-xl p-3 max-h-64">
          <Queue tracks={queue} onSelect={onSelectFromQueue} />
        </div>
      )}

      <div
        style={{ "--color-soft": track.colorSoft } as CSSProperties}
        className="mini-tint shadow-raised rounded-xl px-4 pt-3 pb-2.5"
      >
        <div className="flex items-center gap-3">
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="w-11 h-11 rounded-sm object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-sm bg-inset shrink-0" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body text-text leading-tight">{track.title}</span>
            <span className="block truncate text-footnote text-muted leading-tight">
              {playbackError ? "Lecture impossible — passe au suivant" : track.artist}
            </span>
          </span>
          <button
            onClick={() => setShowQueue((v) => !v)}
            className={`p-2 shrink-0 ${showQueue ? "text-text" : "text-tertiary"}`}
            aria-label="File d'attente"
          >
            <ListMusic size={20} />
          </button>
          {airplaySupported && (
            <button onClick={onAirplay} className="p-2 shrink-0 text-tertiary" aria-label="Sortie audio">
              <Airplay size={20} />
            </button>
          )}
        </div>

        <div className="mt-2 space-y-0.5">
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

        <div className="flex items-center justify-center gap-7 mt-1">
          <button
            onClick={onToggleShuffle}
            className={shuffle ? "text-text" : "text-tertiary hover:text-muted"}
            aria-label="Lecture aléatoire"
          >
            <Shuffle size={18} />
          </button>
          <button onClick={onPrevious} className="text-text hover:opacity-70" aria-label="Titre précédent">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="press-tactile w-11 h-11 rounded-full bg-highlight shadow-raised-sm flex items-center justify-center text-text"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button onClick={onNext} className="text-text hover:opacity-70" aria-label="Titre suivant">
            <SkipForward size={24} fill="currentColor" />
          </button>
          <button
            onClick={onToggleRepeat}
            className={repeat ? "text-text" : "text-tertiary hover:text-muted"}
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
