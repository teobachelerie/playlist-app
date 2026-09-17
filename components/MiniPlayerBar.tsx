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
      className="press-tactile glass-surface fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 px-3.5 py-3 rounded-xl text-left"
    >
      {track.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.coverUrl}
          alt=""
          className="w-12 h-12 rounded-sm object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-sm bg-inset shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-text">{track.title}</span>
        <span className="block truncate text-footnote text-muted">{track.artist}</span>
      </span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
        className="press-tactile w-10 h-10 rounded-full bg-highlight shadow-raised-sm flex items-center justify-center text-text"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </span>
    </button>
  );
}

export default memo(MiniPlayerBar);
