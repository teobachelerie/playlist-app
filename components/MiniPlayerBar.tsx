"use client";

import { Play, Pause } from "lucide-react";
import type { Track } from "@/lib/playlist";

export default function MiniPlayerBar({
  track,
  isPlaying,
  onTogglePlay,
  onOpen,
}: {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 px-3 py-2 rounded-xl shadow-lg text-left bg-surface/95 backdrop-blur border border-white/10"
    >
      {track.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.coverUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-white/10 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-text text-sm">{track.title}</span>
        <span className="block truncate text-muted text-xs">{track.artist}</span>
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="p-2 text-text"
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </span>
    </button>
  );
}
