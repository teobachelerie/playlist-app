"use client";

import { memo } from "react";
import { Play, Pause } from "lucide-react";
import type { Track } from "@/lib/playlist";

function MiniPlayerBar({
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
      className="press-tactile bg-surface-1 fixed inset-x-12 bottom-4 z-40 flex items-center gap-2.5 pl-2 pr-2 py-2 rounded-full shadow-float text-left"
    >
      {track.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.coverUrl} alt="" className="pochette w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-inset shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-footnote titre-encre">{track.title}</span>
        <span className="block truncate text-caption text-tertiary leading-tight">{track.artist}</span>
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="press-tactile btn-encre w-9 h-9 flex items-center justify-center shrink-0"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </span>
    </button>
  );
}

export default memo(MiniPlayerBar);
