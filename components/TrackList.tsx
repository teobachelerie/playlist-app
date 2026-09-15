"use client";

import type { Track } from "@/lib/playlist";
import ThemeToggle from "@/components/ThemeToggle";

export default function TrackList({
  tracks,
  currentId,
  onSelect,
}: {
  tracks: Track[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="min-h-full bg-base">
      <div
        className="sticky top-0 z-10 bg-base flex items-center justify-between px-5 pt-6 pb-3"
        style={{ paddingLeft: "var(--gutter-screen)", paddingRight: "var(--gutter-screen)" }}
      >
        <h1 className="text-title-1 font-semibold text-text">Playlist</h1>
        <ThemeToggle />
      </div>

      {tracks.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-center">
          <p className="text-muted">
            Playlist vide — ajoute un premier titre avec{" "}
            <code className="text-text">npm run add-track</code>.
          </p>
        </div>
      ) : (
        <ul className="px-2 pb-28">
          {tracks.map((track) => {
            const active = track.id === currentId;
            return (
              <li key={track.id} className="px-3">
                <button
                  onClick={() => onSelect(track.id)}
                  className={`press-tactile active:opacity-[0.55] w-full text-left flex items-center gap-3 my-1 px-3 py-2.5 rounded-control transition duration-base ease-standard ${
                    active ? "bg-highlight shadow-raised-sm" : ""
                  }`}
                >
                  {track.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.coverUrl}
                      alt=""
                      className="w-11 h-11 rounded-sm object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-sm bg-inset shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 flex items-baseline justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block truncate text-body text-text">{track.title}</span>
                      <span className="block truncate text-footnote text-muted">{track.artist}</span>
                    </span>
                    <span className="text-caption text-tertiary shrink-0 tabular-nums">
                      {Math.floor(track.duration / 60)}:
                      {String(track.duration % 60).padStart(2, "0")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
