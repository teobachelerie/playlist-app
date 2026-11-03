"use client";

import type { Track } from "@/lib/playlist";
import { memo } from "react";

function Queue({
  tracks,
  onSelect,
}: {
  tracks: Track[];
  onSelect: (id: string) => void;
}) {
  if (tracks.length === 0) {
    return <p className="text-tertiary text-subhead">Fin de la playlist.</p>;
  }

  return (
    <div className="h-full overflow-y-auto space-y-1">
      <p className="label-section mb-2">À suivre</p>
      {tracks.map((track) => (
        <button
          key={track.id}
          onClick={() => onSelect(track.id)}
          className="press-tactile w-full text-left flex items-center gap-3 py-2 px-2 rounded-sm active:bg-inset"
        >
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="pochette w-9 h-9 rounded-xs object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xs bg-inset shrink-0" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-text text-subhead font-medium">{track.title}</span>
            <span className="block truncate text-tertiary text-footnote">{track.artist}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default memo(Queue);
