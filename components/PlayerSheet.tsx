"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Play,
  Pause,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
  Repeat,
  Cast,
  Captions,
  ListMusic,
  Volume1,
  Volume2,
} from "lucide-react";
import type { Track } from "@/lib/playlist";
import Lyrics from "@/components/Lyrics";
import Queue from "@/components/Queue";

const MINI_HEIGHT = 64; // hauteur visible du mini-lecteur quand la feuille est fermée

type PanelMode = "lyrics" | "cover" | "queue";

export default function PlayerSheet({
  track,
  queue,
  isPlaying,
  currentTime,
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
  const dragStartRef = useRef<{ y: number; wasOpen: boolean } | null>(null);
  const [airplaySupported, setAirplaySupported] = useState(false);

  useEffect(() => {
    // Détecté seulement après montage pour éviter un mismatch d'hydratation
    // (le serveur ne peut pas savoir si le navigateur est Safari).
    setAirplaySupported("webkitShowPlaybackTargetPicker" in HTMLMediaElement.prototype);
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    dragStartRef.current = { y: e.clientY, wasOpen: open };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current) return;
    const delta = e.clientY - dragStartRef.current.y;
    setDragY(delta);
  }

  function handlePointerUp() {
    if (dragY === null) {
      dragStartRef.current = null;
      return;
    }
    // Seuil de bascule : 30% de l'écran suffit à changer d'état.
    const threshold = window.innerHeight * 0.3;
    if (dragStartRef.current?.wasOpen && dragY > threshold) onOpenChange(false);
    else if (!dragStartRef.current?.wasOpen && dragY < -threshold) onOpenChange(true);
    setDragY(null);
    dragStartRef.current = null;
  }

  // Position de la feuille : 0 = ouverte plein écran, "closedOffset" = repliée
  // en mini-lecteur. Pendant le drag on suit le doigt, sinon on snap à l'état.
  const closedOffset = `calc(100% - ${MINI_HEIGHT}px)`;
  let transform: string;
  if (dragY !== null) {
    const base = open ? 0 : window.innerHeight - MINI_HEIGHT;
    const next = Math.min(Math.max(base + dragY, 0), window.innerHeight - MINI_HEIGHT);
    transform = `translateY(${next}px)`;
  } else {
    transform = open ? "translateY(0)" : `translateY(${closedOffset})`;
  }

  function handleAirplay() {
    const el = audioRef.current as HTMLAudioElement & { webkitShowPlaybackTargetPicker?: () => void };
    el?.webkitShowPlaybackTargetPicker?.();
  }

  return (
    <div
      className="dynamic-bg fixed inset-x-0 bottom-0 h-screen rounded-t-2xl shadow-2xl flex flex-col"
      style={
        {
          transform,
          transition: dragY === null ? "transform 0.35s cubic-bezier(0.32,0.72,0,1)" : "none",
          "--color-primary": track.colorPrimary,
          "--color-secondary": track.colorSecondary,
        } as React.CSSProperties
      }
    >
      {/* Poignée de glissement + zone tapable pour ouvrir/fermer */}
      <div
        className="pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-10 h-1.5 rounded-full bg-white/30" />
      </div>

      {/* Mini-lecteur (visible surtout quand fermé, mais toujours en haut de la feuille) */}
      <button
        onClick={() => onOpenChange(true)}
        className="flex items-center gap-3 px-4 pb-2 text-left"
        style={{ height: MINI_HEIGHT - 24 }}
      >
        {track.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.coverUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded bg-white/10 shrink-0" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-text text-sm">{track.title}</span>
          <span className="block truncate text-muted text-xs">{track.artist}</span>
        </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className="p-2 text-text"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </span>
      </button>

      {/* Contenu plein écran */}
      <div className="flex-1 overflow-hidden flex flex-col px-6 pb-8 gap-6">
        <div className="flex items-center gap-4">
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="w-16 h-16 rounded-md object-cover shrink-0 shadow-lg" />
          ) : (
            <div className="w-16 h-16 rounded-md bg-white/10 shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl text-text truncate">{track.title}</h1>
            <p className="text-muted truncate">{track.artist}</p>
          </div>
        </div>

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
              <div className="w-full aspect-square rounded-lg bg-white/10" />
            ))}
          {panel === "queue" && <Queue tracks={queue} onSelect={onSelectFromQueue} />}
        </div>

        {/* Ligne d'icônes secondaires */}
        <div className="flex items-center justify-between text-muted">
          <button
            onClick={() => setPanel(panel === "lyrics" ? "cover" : "lyrics")}
            className={panel === "lyrics" ? "text-accent" : "hover:text-text"}
            aria-label="Afficher/masquer les paroles"
          >
            <Captions size={20} />
          </button>
          {airplaySupported && (
            <button onClick={handleAirplay} className="hover:text-text" aria-label="Sortie audio">
              <Cast size={20} />
            </button>
          )}
          <button
            onClick={() => setPanel(panel === "queue" ? "lyrics" : "queue")}
            className={panel === "queue" ? "text-accent" : "hover:text-text"}
            aria-label="File d'attente"
          >
            <ListMusic size={20} />
          </button>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={onToggleShuffle}
            className={shuffle ? "text-accent" : "text-muted hover:text-text"}
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
            className="w-14 h-14 rounded-full bg-white text-base flex items-center justify-center"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
          </button>
          <button onClick={onNext} className="text-text hover:opacity-70" aria-label="Titre suivant">
            <ChevronsRight size={32} fill="currentColor" />
          </button>
          <button
            onClick={onToggleRepeat}
            className={repeat ? "text-accent" : "text-muted hover:text-text"}
            aria-label="Répéter"
          >
            <Repeat size={20} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 text-muted">
          <Volume1 size={16} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={1}
            onChange={(e) => {
              if (audioRef.current) audioRef.current.volume = parseFloat(e.target.value);
            }}
            className="flex-1 accent-white"
          />
          <Volume2 size={16} />
        </div>
      </div>
    </div>
  );
}
