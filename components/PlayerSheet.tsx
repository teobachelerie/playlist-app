"use client";

import { Fragment, useEffect, useRef, useState, type RefObject } from "react";
import {
  Play,
  Pause,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
  Repeat,
  Airplay,
  Captions,
  ListMusic,
} from "lucide-react";
import type { Track } from "@/lib/playlist";
import Lyrics from "@/components/Lyrics";
import Queue from "@/components/Queue";

type PanelMode = "lyrics" | "cover" | "queue";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlayerSheet({
  track,
  queue,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeat,
  open,
  onOpenChange,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onSeek,
  onSelectFromQueue,
  audioRef,
}: {
  track: Track;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onSeek: (time: number) => void;
  onSelectFromQueue: (id: string) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
}) {
  const [panel, setPanel] = useState<PanelMode>("lyrics");
  const [dragY, setDragY] = useState<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const [airplaySupported, setAirplaySupported] = useState(false);

  useEffect(() => {
    // Détecté seulement après montage pour éviter un mismatch d'hydratation
    // (le serveur ne peut pas savoir si le navigateur est Safari).
    setAirplaySupported("webkitShowPlaybackTargetPicker" in HTMLMediaElement.prototype);
  }, []);

  // Glissement pour fermer uniquement (la feuille n'est ni visible ni
  // interactive une fois fermée — l'ouverture se fait depuis la mini-barre
  // indépendante affichée par le composant parent).
  function handlePointerDown(e: React.PointerEvent) {
    dragStartYRef.current = e.clientY;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragStartYRef.current === null) return;
    const delta = e.clientY - dragStartYRef.current;
    setDragY(Math.max(delta, 0));
  }

  function handlePointerUp() {
    if (dragY === null) {
      dragStartYRef.current = null;
      return;
    }
    // Seuil de bascule : 30% de l'écran suffit à fermer.
    if (dragY > window.innerHeight * 0.3) onOpenChange(false);
    setDragY(null);
    dragStartYRef.current = null;
  }

  // Position de la feuille : ouverte = translateY(0), fermée = entièrement
  // hors écran (translateY(100%)). Pendant le drag on suit le doigt.
  let transform: string;
  if (dragY !== null) {
    transform = `translateY(${Math.min(dragY, window.innerHeight)}px)`;
  } else {
    transform = open ? "translateY(0)" : "translateY(100%)";
  }

  function handleAirplay() {
    const el = audioRef.current as HTMLAudioElement & { webkitShowPlaybackTargetPicker?: () => void };
    el?.webkitShowPlaybackTargetPicker?.();
  }

  return (
    <Fragment>
      {/* Bloque les interactions avec la playlist en arrière-plan tant que
          la feuille n'est pas entièrement fermée (ouverte ou en cours de
          glissement) — sans ça, la zone révélée pendant le geste laisse
          passer les touchers vers la liste derrière. */}
      <div
        className="fixed inset-0 z-30"
        style={{ pointerEvents: open || dragY !== null ? "auto" : "none" }}
      />

      <div
        className="dynamic-bg fixed inset-x-0 bottom-0 h-dvh rounded-t-2xl shadow-2xl flex flex-col overflow-hidden z-40"
        style={
          {
            transform,
            transition: dragY === null ? "transform 0.35s cubic-bezier(0.32,0.72,0,1)" : "none",
            "--color-soft": track.colorSoft,
            "--color-light": track.colorLight,
            "--color-dark": track.colorDark,
          } as React.CSSProperties
        }
      >
        {/* Zone de fermeture par glissement — toute la partie haute (poignée
            + pochette/titre), pas seulement la petite poignée : bien plus
            facile à attraper, comme les autres apps de musique. */}
        <div
          className="pt-2 pb-4 px-6 flex flex-col gap-4 cursor-grab active:cursor-grabbing touch-none shrink-0"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="flex justify-center">
            <div className="w-10 h-1.5 rounded-full bg-hairline" />
          </div>
          <div className="flex items-center gap-4">
            {track.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.coverUrl}
                alt=""
                draggable={false}
                className="w-16 h-16 rounded-md object-cover shrink-0 shadow-lg select-none"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-inset shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl text-text truncate">{track.title}</h1>
              <p className="text-muted truncate">{track.artist}</p>
            </div>
          </div>
        </div>

        {/* Reste du contenu — pas de glissement ici, pour ne pas gêner le
            défilement tactile des paroles. */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-8 gap-6">
          <div className="flex-1 overflow-hidden">
            {panel === "lyrics" && (
              <Lyrics
                lyricsUrl={track.lyricsUrl}
                wordsUrl={track.wordsUrl}
                currentTime={currentTime}
                onSeek={onSeek}
              />
            )}
            {panel === "cover" &&
              (track.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={track.coverUrl} alt="" className="w-full aspect-square object-cover rounded-lg" />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-inset" />
              ))}
            {panel === "queue" && <Queue tracks={queue} onSelect={onSelectFromQueue} />}
          </div>

          {/* Barre de progression — piste "enfoncée" façon néomorphisme,
              avance affichée et seek au clic/glisser */}
          <div className="space-y-1">
            <div className="rounded-full px-3 py-2 bg-inset shadow-inset-sm">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={Math.min(currentTime, duration || 0)}
                step={0.1}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full accent-accent h-1 block"
                aria-label="Progression du titre"
              />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(Math.max(duration - currentTime, 0))}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={onToggleShuffle}
              className={shuffle ? "text-text" : "text-tertiary hover:text-muted"}
              aria-label="Lecture aléatoire"
            >
              <Shuffle size={20} />
            </button>
            <button
              onClick={onPrevious}
              className="text-text hover:opacity-70"
              aria-label="Titre précédent"
            >
              <ChevronsLeft size={32} fill="currentColor" />
            </button>
            <button
              onClick={onTogglePlay}
              className="press-tactile shadow-raised w-14 h-14 rounded-full bg-highlight flex items-center justify-center text-text"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
            </button>
            <button onClick={onNext} className="text-text hover:opacity-70" aria-label="Titre suivant">
              <ChevronsRight size={32} fill="currentColor" />
            </button>
            <button
              onClick={onToggleRepeat}
              className={repeat ? "text-text" : "text-tertiary hover:text-muted"}
              aria-label="Répéter"
            >
              <Repeat size={20} />
            </button>
          </div>

          {/* Ligne d'icônes secondaires — trois colonnes égales, comme Apple Music */}
          <div className="grid grid-cols-3 items-center text-tertiary px-2">
            <button
              onClick={() => setPanel(panel === "lyrics" ? "cover" : "lyrics")}
              className={`justify-self-start ${panel === "lyrics" ? "text-text" : "hover:text-muted"}`}
              aria-label="Afficher/masquer les paroles"
            >
              <Captions size={26} />
            </button>
            <div className="justify-self-center">
              {airplaySupported && (
                <button onClick={handleAirplay} className="hover:text-muted" aria-label="Sortie audio">
                  <Airplay size={26} />
                </button>
              )}
            </div>
            <button
              onClick={() => setPanel(panel === "queue" ? "lyrics" : "queue")}
              className={`justify-self-end ${panel === "queue" ? "text-text" : "hover:text-muted"}`}
              aria-label="File d'attente"
            >
              <ListMusic size={26} />
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
