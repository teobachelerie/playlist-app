"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/playlist";
import { shuffleAvoidingSameArtist } from "@/lib/shuffle";
import TrackList from "@/components/TrackList";
import CompactPlayer from "@/components/CompactPlayer";

const ORDER_KEY = "playlist-ordre";

// Applique l'ordre personnalisé enregistré (ids) ; les titres absents de cet
// ordre (ajoutés depuis) gardent leur place relative, à la fin.
function applySavedOrder(tracks: Track[], ids: string[]): Track[] {
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const ordered = ids.map((id) => byId.get(id)).filter((t): t is Track => !!t);
  const seen = new Set(ordered.map((t) => t.id));
  return [...ordered, ...tracks.filter((t) => !seen.has(t.id))];
}

export default function PlaylistApp({ tracks }: { tracks: Track[] }) {
  // Ordre de la liste (personnalisable par glisser) ; base de la lecture
  // quand l'aléatoire est coupé.
  const [listOrder, setListOrder] = useState<Track[]>(tracks);
  const [order, setOrder] = useState<Track[]>(tracks);
  const [position, setPosition] = useState(0);
  const [hasSelected, setHasSelected] = useState(false); // rien ne joue tant qu'on n'a pas choisi un titre
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [airplaySupported, setAirplaySupported] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = hasSelected ? (order[position] ?? null) : null;

  // Valeurs à jour pour les gestionnaires appelés hors rendu React (fin de
  // titre, écran verrouillé) : en arrière-plan, ils doivent agir tout de suite.
  const live = useRef({ order, position, repeat, shuffle, listOrder });
  live.current = { order, position, repeat, shuffle, listOrder };

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "null");
      if (Array.isArray(ids)) {
        const saved = applySavedOrder(tracks, ids);
        setListOrder(saved);
        setOrder(saved);
      }
    } catch {}
  }, [tracks]);

  useEffect(() => {
    setAirplaySupported("webkitShowPlaybackTargetPicker" in HTMLMediaElement.prototype);
  }, []);

  useEffect(() => {
    setPlaybackError(false);
  }, [position]);

  // Lance un titre tout de suite sur l'élément <audio>, sans attendre un
  // rendu React. Indispensable en arrière-plan (Waze, écran verrouillé) : à
  // la fin d'un titre iOS suspend la page dès que le son s'arrête, un rendu
  // différé ne lancerait jamais le suivant.
  function startTrack(idx: number, ord: Track[]) {
    const track = ord[idx];
    const el = audioRef.current;
    if (!track || !el) return;
    if (el.src !== track.audioUrl) el.src = track.audioUrl;
    el.play().catch((err) => console.error("play() rejeté (peut être transitoire) :", err));
    setOrder(ord);
    setPosition(idx);
    setHasSelected(true);
  }

  // Suivi fin du temps de lecture via requestAnimationFrame plutôt que
  // l'événement natif "timeupdate" (qui ne se déclenche que ~4 fois/seconde
  // et introduit un retard perceptible sur le surlignage mot par mot).
  useEffect(() => {
    if (!isPlaying) return;
    let frame: number;
    const tick = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  // Media Session : ce qui alimente l'écran verrouillé et le centre de
  // contrôle (cover, titre, boutons suivant/précédent réels au lieu des
  // sauts de 10s par défaut du navigateur).
  useEffect(() => {
    if (!current || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: current.coverUrl ? [{ src: current.coverUrl, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch((err) => console.error("play() rejeté :", err));
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    // Neutralise les boutons de saut ±10s pour ne laisser que précédent/suivant.
    navigator.mediaSession.setActionHandler("seekforward", null);
    navigator.mediaSession.setActionHandler("seekbackward", null);
  }, [current]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      return;
    }
    // isPlaying/playbackError sont mis à jour par les événements natifs
    // onPlay/onPause/onError de l'élément <audio>, pas ici directement —
    // c'est la seule source fiable (voir commentaire plus bas).
    audioRef.current.play().catch((err) => console.error("play() rejeté :", err));
  }
  const togglePlayCb = useCallback(togglePlay, [isPlaying]);

  function playNext() {
    const { order, position, repeat, shuffle, listOrder } = live.current;
    if (position + 1 < order.length) {
      startTrack(position + 1, order);
      return;
    }
    // Fin de l'ordre de lecture.
    if (repeat) {
      startTrack(0, shuffle ? shuffleAvoidingSameArtist(listOrder) : order);
    } else {
      audioRef.current?.pause();
    }
  }

  function playPrevious() {
    const { order, position } = live.current;
    if (position > 0) startTrack(position - 1, order);
  }

  function selectTrack(id: string) {
    const ord = live.current.order;
    const idx = ord.findIndex((t) => t.id === id);
    if (idx !== -1) startTrack(idx, ord);
  }
  const selectTrackCb = useCallback(selectTrack, []);

  // Nouvel ordre de la liste (glisser-déposer) : enregistré sur l'appareil,
  // et repris par la lecture si l'aléatoire est coupé.
  function reorder(next: Track[]) {
    setListOrder(next);
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(next.map((t) => t.id)));
    } catch {}
    if (!live.current.shuffle) {
      setOrder(next);
      if (current) setPosition(next.findIndex((t) => t.id === current.id));
    }
  }
  const reorderCb = useCallback(reorder, [current]);

  function toggleShuffle() {
    if (!shuffle) {
      const currentTrack = current;
      const rest = listOrder.filter((t) => t.id !== currentTrack?.id);
      const shuffled = shuffleAvoidingSameArtist(rest);
      const newOrder = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      setOrder(newOrder);
      setPosition(0);
    } else {
      const currentTrack = current;
      setOrder(listOrder);
      setPosition(currentTrack ? listOrder.findIndex((t) => t.id === currentTrack.id) : 0);
    }
    setShuffle(!shuffle);
  }

  function seek(time: number) {
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  }
  const seekCb = useCallback(seek, []);

  function handleAirplay() {
    const el = audioRef.current as HTMLAudioElement & { webkitShowPlaybackTargetPicker?: () => void };
    el?.webkitShowPlaybackTargetPicker?.();
  }

  return (
    <div className="app-ecran fin-backdrop h-dvh overflow-hidden relative">
      <div className="h-full">
        <TrackList
          tracks={listOrder}
          currentId={current?.id ?? null}
          isPlaying={isPlaying}
          onSelect={selectTrackCb}
          onReorder={reorderCb}
        />
      </div>

      {current && (
        <CompactPlayer
          track={current}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackError={playbackError}
          shuffle={shuffle}
          repeat={repeat}
          onTogglePlay={togglePlayCb}
          onNext={playNext}
          onPrevious={playPrevious}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={() => setRepeat(!repeat)}
          onSeek={seekCb}
          airplaySupported={airplaySupported}
          onAirplay={handleAirplay}
        />
      )}

      {/* Toujours monté, source posée à la main (startTrack) : React ne doit
          pas réassigner src, ce qui relancerait le titre au début. */}
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={playNext}
        onPlay={() => {
          setIsPlaying(true);
          setPlaybackError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          console.error("Erreur de chargement audio pour :", current?.title, current?.audioUrl);
          setPlaybackError(true);
          setIsPlaying(false);
        }}
      />
    </div>
  );
}
