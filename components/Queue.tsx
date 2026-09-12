"use client";

import type { Track } from "@/lib/playlist";

export default function Queue({
  tracks,
  onSelect,
}: {
  tracks: Track[];
  onSelect: (id: string) => void;
}) {
  if (tracks.length === 0) {
    return <p className="text-muted text-sm">Fin de la playlist.</p>;
  }

  return (
    <div className="h-full overflow-y-auto space-y-1">
      <p className="text-muted text-xs uppercase tracking-wide mb-2">À suivre</p>
      {tracks.map((track) => (
        <button
          key={track.id}
          onClick={() => onSelect(track.id)}
          className="w-full text-left flex items-center gap-3 py-2 hover:bg-white/5 rounded px-2"
        >
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded bg-white/10 shrink-0" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-text text-sm">{track.title}</span>
            <span className="block truncate text-muted text-xs">{track.artist}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
