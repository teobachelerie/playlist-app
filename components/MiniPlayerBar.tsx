"use client";

import { memo } from "react";
import { Play, Pause } from "lucide-react";
import type { Track } from "@/lib/playlist";
import type { CSSProperties } from "react";

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
      style={{ "--color-soft": track.colorSoft } as CSSProperties}
      className="press-tactile mini-tint fixed inset-x-4 bottom-4 z-40 flex items-center gap-2.5 pl-2 pr-2 py-2 rounded-full shadow-raised text-left"
    >
      {track.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.coverUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-inset shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-footnote text-text leading-tight">{track.title}</span>
        <span className="block truncate text-caption text-muted leading-tight">{track.artist}</span>
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="press-tactile w-9 h-9 rounded-full bg-inset shadow-inset-sm flex items-center justify-center text-text shrink-0"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </span>
    </button>
  );
}

export default memo(MiniPlayerBar);
