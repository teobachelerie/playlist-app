"use client";

import { memo } from "react";
import type { Track } from "@/lib/playlist";
import ThemeToggle from "@/components/ThemeToggle";
import AddTrackButton from "@/components/AddTrackButton";

function TrackList({
  tracks,
  currentId,
  isPlaying,
  onSelect,
}: {
  tracks: Track[];
  currentId: string | null;
  isPlaying: boolean;
  onSelect: (id: string) => void;
}) {
  const totalMin = Math.round(tracks.reduce((sum, t) => sum + t.duration, 0) / 60);

  return (
    <div className="h-full flex flex-col">
      <div
        className="shrink-0 z-10 flex items-center justify-between px-5 pt-6 pb-3"
        style={{ paddingLeft: "var(--gutter-screen)", paddingRight: "var(--gutter-screen)" }}
      >
        <div>
          <h1 className="titre-encre text-display intro-fondu">
            Ma <span className="mot-fort intro-monte">playlist</span>
          </h1>
          {tracks.length > 0 && (
            <p className="label-section mt-1 tabular-nums">
              {tracks.length} titres · {totalMin} min
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AddTrackButton />
          <ThemeToggle />
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="titre-encre text-title-1">
            Rien à <span className="mot-fort">écouter</span>
          </p>
          <p className="text-subhead text-tertiary">
            Ajoute un premier titre avec le bouton + ou <code>npm run add-track</code>.
          </p>
        </div>
      ) : (
        // Cadre fixe, coupe nette en haut et en bas : la zone de défilement a
        // les mêmes coins arrondis que la carte (20 px + 1 px de bordure), deux
        // liserés redessinent les bords. Le lecteur se pose par-dessus, aligné
        // sur le bas du cadre ; la liste réserve sa hauteur en marge intérieure.
        <div className="relative flex-1 min-h-0 mx-4 mt-2" style={{ marginBottom: "var(--gutter-screen)" }}>
          <div className="h-full overflow-y-auto rounded-[21px] p-px">
            <ul
              className="carte overflow-hidden"
              style={currentId ? { paddingBottom: "var(--player-height)" } : undefined}
            >
              {tracks.map((track) => {
                const active = track.id === currentId;
                return (
                  <li key={track.id} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => onSelect(track.id)}
                      aria-current={active ? "true" : undefined}
                      className={`press-tactile active:opacity-[0.55] w-full text-left flex items-center gap-3 px-3 py-2.5 transition duration-base ease-standard ${
                        active ? "bg-surface-2" : ""
                      }`}
                    >
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.coverUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="pochette w-11 h-11 rounded-sm object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-sm bg-inset shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 flex items-baseline justify-between gap-4">
                        <span className="min-w-0">
                          <span
                            className={`flex items-center gap-1.5 text-body font-medium ${
                              active ? "text-orange" : "text-text"
                            }`}
                          >
                            {active && (
                              <span className="barres shrink-0" data-lecture={isPlaying} aria-hidden="true">
                                <span />
                                <span />
                                <span />
                              </span>
                            )}
                            <span className="truncate">{track.title}</span>
                          </span>
                          <span className="block truncate text-footnote text-tertiary">{track.artist}</span>
                        </span>
                        <span className="text-caption text-tertiary shrink-0 tabular-nums">
                          {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-[21px] border-x border-t border-border"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-[21px] border-x border-b border-border"
          />
        </div>
      )}
    </div>
  );
}

export default memo(TrackList);
