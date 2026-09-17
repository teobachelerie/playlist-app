"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/playlist";
import { shuffleAvoidingSameArtist } from "@/lib/shuffle";
import TrackList from "@/components/TrackList";
import PlayerSheet from "@/components/PlayerSheet";
import MiniPlayerBar from "@/components/MiniPlayerBar";

export default function PlaylistApp({ tracks }: { tracks: Track[] }) {
  const [order, setOrder] = useState<Track[]>(tracks);
  const [position, setPosition] = useState(0);
  const [hasSelected, setHasSelected] = useState(false); // rien ne joue tant qu'on n'a pas choisi un titre
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = hasSelected ? order[position] ?? null : null;

  useEffect(() => {
    setPlaybackError(false);
  }, [position]);

  useEffect(() => {
    if (isPlaying) {
      setPlaybackError(false);
      audioRef.current?.play().catch((err) => {
        console.error("Lecture impossible :", err);
        setIsPlaying(false);
        setPlaybackError(true);
      });
    }
  }, [position, isPlaying]);

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
      artwork: current.coverUrl
        ? [{ src: current.coverUrl, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current
        ?.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    // Neutralise les boutons de saut ±10s pour ne laisser que précédent/suivant.
    navigator.mediaSession.setActionHandler("seekforward", null);
    navigator.mediaSession.setActionHandler("seekbackward", null);
  }, [current, position, order, repeat, shuffle]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    setPlaybackError(false);
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        // Ne pas afficher "en lecture" si ça a réellement échoué (fichier
        // cassé, etc.) — avant, l'état passait à "lecture" quoi qu'il arrive,
        // ce qui donnait l'impression que ça restait bloqué à zéro.
        console.error("Lecture impossible :", err);
        setIsPlaying(false);
        setPlaybackError(true);
      });
  }
  const togglePlayCb = useCallback(togglePlay, [isPlaying]);

  function playNext() {
    if (position + 1 < order.length) {
      setPosition(position + 1);
      setIsPlaying(true);
      return;
    }
    // Fin de l'ordre de lecture.
    if (repeat) {
      if (shuffle) setOrder(shuffleAvoidingSameArtist(tracks));
      setPosition(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }

  function playPrevious() {
    if (position > 0) {
      setPosition(position - 1);
      setIsPlaying(true);
    }
  }

  function selectTrack(id: string) {
    const idx = order.findIndex((t) => t.id === id);
    if (idx === -1) return;
    setPosition(idx);
    setHasSelected(true);
    setIsPlaying(true);
    setSheetOpen(true);
  }
  const selectTrackCb = useCallback(selectTrack, [order]);

  function toggleShuffle() {
    if (!shuffle) {
      const currentTrack = current;
      const rest = tracks.filter((t) => t.id !== currentTrack?.id);
      const shuffled = shuffleAvoidingSameArtist(rest);
      const newOrder = currentTrack ? [currentTrack, ...shuffled] : shuffled;
      setOrder(newOrder);
      setPosition(0);
    } else {
      const currentTrack = current;
      setOrder(tracks);
      setPosition(currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : 0);
    }
    setShuffle(!shuffle);
  }

  function seek(time: number) {
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  }
  const seekCb = useCallback(seek, []);
  const openSheetCb = useCallback(() => setSheetOpen(true), []);

  return (
    <div className="h-dvh overflow-hidden relative bg-base">
      <div className="h-full overflow-y-auto">
        <TrackList tracks={tracks} currentId={current?.id ?? null} onSelect={selectTrackCb} />
      </div>

      {current && !sheetOpen && (
        <MiniPlayerBar
          track={current}
          isPlaying={isPlaying}
          onTogglePlay={togglePlayCb}
          onOpen={openSheetCb}
        />
      )}

      {current && (
        <PlayerSheet
          track={current}
          queue={order.slice(position + 1)}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackError={playbackError}
          shuffle={shuffle}
          repeat={repeat}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onTogglePlay={togglePlayCb}
          onNext={playNext}
          onPrevious={playPrevious}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={() => setRepeat(!repeat)}
          onSeek={seekCb}
          onSelectFromQueue={selectTrackCb}
          audioRef={audioRef}
        />
      )}

      {current && (
        <audio
          ref={audioRef}
          src={current.audioUrl}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={playNext}
          onError={() => {
            console.error("Erreur de chargement audio pour :", current.title, current.audioUrl);
            setPlaybackError(true);
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
}
