"use client";

import { memo, useMemo, useRef, useState } from "react";
import { GripVertical, Search, X } from "lucide-react";
import type { Track } from "@/lib/playlist";
import ThemeToggle from "@/components/ThemeToggle";
import AddTrackButton from "@/components/AddTrackButton";

// Recherche insensible aux majuscules et aux accents.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;

function TrackList({
  tracks,
  currentId,
  isPlaying,
  onSelect,
  onReorder,
}: {
  tracks: Track[];
  currentId: string | null;
  isPlaying: boolean;
  onSelect: (id: string) => void;
  onReorder: (next: Track[]) => void;
}) {
  const totalMin = Math.round(tracks.reduce((sum, t) => sum + t.duration, 0) / 60);

  const [query, setQuery] = useState("");
  const q = normalize(query.trim());
  // Le titre OU l'artiste doit contenir le texte tapé.
  const visible = useMemo(
    () => (q ? tracks.filter((t) => normalize(t.title).includes(q) || normalize(t.artist).includes(q)) : tracks),
    [tracks, q],
  );

  // Mode réorganisation : appui long sur un titre → poignées à gauche,
  // glisser une poignée déplace le titre. « OK » pour terminer.
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState<{ id: string; offset: number } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const longPressed = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; lastY: number; offset: number; rowH: number; list: Track[] } | null>(null);
  const autoScroll = useRef<number | null>(null);

  function cancelPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
    pressStart.current = null;
  }

  function onRowPointerDown(e: React.PointerEvent) {
    if (editing || q) return;
    longPressed.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setEditing(true);
      cancelPress();
    }, LONG_PRESS_MS);
  }

  function onRowPointerMove(e: React.PointerEvent) {
    const start = pressStart.current;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE) cancelPress();
  }

  function onRowClick(id: string) {
    // Le relâchement d'un appui long ne doit pas lancer le titre.
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (!editing) onSelect(id);
  }

  // Déplace le titre glissé d'une ligne tant que le doigt dépasse la moitié
  // d'une ligne voisine.
  function moveBy(dy: number) {
    const st = dragState.current;
    if (!st) return;
    st.offset += dy;
    let idx = st.list.findIndex((t) => t.id === st.id);
    let list = st.list;
    while (st.offset > st.rowH / 2 && idx < list.length - 1) {
      list = [...list];
      [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
      idx += 1;
      st.offset -= st.rowH;
    }
    while (st.offset < -st.rowH / 2 && idx > 0) {
      list = [...list];
      [list[idx], list[idx - 1]] = [list[idx - 1], list[idx]];
      idx -= 1;
      st.offset += st.rowH;
    }
    if (list !== st.list) {
      st.list = list;
      onReorder(list);
    }
    setDrag({ id: st.id, offset: st.offset });
  }

  function onHandlePointerDown(e: React.PointerEvent, id: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const row = (e.currentTarget as HTMLElement).closest("li");
    dragState.current = {
      id,
      lastY: e.clientY,
      offset: 0,
      rowH: row?.getBoundingClientRect().height ?? 64,
      list: tracks,
    };
    setDrag({ id, offset: 0 });
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    const st = dragState.current;
    if (!st) return;
    const dy = e.clientY - st.lastY;
    st.lastY = e.clientY;
    moveBy(dy);

    // Défilement automatique près des bords du cadre.
    const box = scrollRef.current?.getBoundingClientRect();
    if (autoScroll.current) cancelAnimationFrame(autoScroll.current);
    autoScroll.current = null;
    if (!box) return;
    const edge = 64;
    const speed = e.clientY < box.top + edge ? -8 : e.clientY > box.bottom - edge ? 8 : 0;
    if (speed) {
      const step = () => {
        const el = scrollRef.current;
        if (!el || !dragState.current) return;
        const before = el.scrollTop;
        el.scrollTop += speed;
        const moved = el.scrollTop - before;
        if (moved) moveBy(moved);
        autoScroll.current = requestAnimationFrame(step);
      };
      autoScroll.current = requestAnimationFrame(step);
    }
  }

  function onHandlePointerUp() {
    if (autoScroll.current) cancelAnimationFrame(autoScroll.current);
    autoScroll.current = null;
    dragState.current = null;
    setDrag(null);
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="shrink-0 z-10 flex items-center justify-between px-5 pb-3"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 24px)",
          paddingLeft: "var(--gutter-screen)",
          paddingRight: "var(--gutter-screen)",
        }}
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
          {editing ? (
            <button onClick={() => setEditing(false)} className="press-tactile btn-encre h-11 px-5 text-subhead">
              OK
            </button>
          ) : (
            <>
              <AddTrackButton />
              <ThemeToggle />
            </>
          )}
        </div>
      </div>

      {tracks.length > 0 && !editing && (
        <div className="shrink-0 mx-4 mt-1 mb-2 relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un titre ou un artiste"
            aria-label="Rechercher un titre ou un artiste"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className="champ w-full h-11 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-tertiary"
              aria-label="Effacer la recherche"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

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
        // Cadre fixe, coupe nette en haut et en bas : c'est la zone de défilement
        // elle-même qui porte le papier, la bordure et les coins (rayon de carte
        // en haut, concentriques à l'écran en bas). Le contenu glisse dedans,
        // rebond compris, sans qu'aucun bord ne bouge. Le lecteur se pose
        // par-dessus, aligné sur le bas du cadre ; la liste réserve sa hauteur.
        <div className="relative flex-1 min-h-0 mx-4 mt-1" style={{ marginBottom: "var(--edge)" }}>
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overscroll-contain bg-surface-1 border border-border rounded-t-[var(--radius-frame-top)] rounded-b-[var(--radius-frame)]"
          >
            {q && visible.length === 0 && (
              <p className="px-4 py-6 text-center text-subhead text-tertiary">
                Aucun titre ni artiste pour « {query.trim()} »
              </p>
            )}
            <ul
              style={{
                paddingBottom: currentId ? "var(--player-height)" : undefined,
              }}
            >
              {visible.map((track) => {
                const active = track.id === currentId;
                const dragged = drag?.id === track.id;
                return (
                  <li
                    key={track.id}
                    className={`relative flex items-center border-b border-border last:border-b-0 ${
                      dragged ? "z-10 bg-surface-1 shadow-float" : ""
                    }`}
                    style={dragged ? { transform: `translateY(${drag.offset}px)` } : undefined}
                  >
                    {editing && (
                      <span
                        onPointerDown={(e) => onHandlePointerDown(e, track.id)}
                        onPointerMove={onHandlePointerMove}
                        onPointerUp={onHandlePointerUp}
                        onPointerCancel={onHandlePointerUp}
                        className="shrink-0 self-stretch flex items-center pl-3 pr-1 text-tertiary touch-none cursor-grab"
                        aria-label={`Déplacer ${track.title}`}
                        role="button"
                      >
                        <GripVertical size={20} />
                      </span>
                    )}
                    <button
                      onPointerDown={onRowPointerDown}
                      onPointerMove={onRowPointerMove}
                      onPointerUp={cancelPress}
                      onPointerCancel={cancelPress}
                      onClick={() => onRowClick(track.id)}
                      onContextMenu={(e) => e.preventDefault()}
                      aria-current={active ? "true" : undefined}
                      className={`press-tactile w-full min-w-0 text-left flex items-center gap-3 px-3 py-2.5 transition duration-base ease-standard [-webkit-touch-callout:none] ${
                        editing ? "" : "active:opacity-[0.55]"
                      } ${active ? "bg-surface-2" : ""}`}
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
        </div>
      )}
    </div>
  );
}

export default memo(TrackList);
