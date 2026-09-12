"use client";

import type { Track } from "@/lib/playlist";

export default function TrackList({
  tracks,
  currentId,
  onSelect,
}: {
  tracks: Track[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  if (tracks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <p className="text-muted">
          Playlist vide — ajoute un premier titre avec{" "}
          <code className="text-text">npm run add-track</code>.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/10">
      {tracks.map((track) => {
        const active = track.id === currentId;
        return (
          <li key={track.id}>
            <button
              onClick={() => onSelect(track.id)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                active ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              {track.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.coverUrl}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-white/10 shrink-0" />
              )}
              <span className="min-w-0 flex-1 flex items-baseline justify-between gap-4">
                <span className="min-w-0">
                  <span
                    className={`block truncate ${active ? "text-accent" : "text-text"}`}
                  >
                    {track.title}
                  </span>
                  <span className="block truncate text-sm text-muted">{track.artist}</span>
                </span>
                <span className="text-xs text-muted shrink-0">
                  {Math.floor(track.duration / 60)}:
                  {String(track.duration % 60).padStart(2, "0")}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
