"use client";

import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/playlist";
import { shuffleAvoidingSameArtist } from "@/lib/shuffle";
import TrackList from "@/components/TrackList";
import PlayerSheet from "@/components/PlayerSheet";

export default function PlaylistApp({ tracks }: { tracks: Track[] }) {
  const [order, setOrder] = useState<Track[]>(tracks);
  const [position, setPosition] = useState(0);
  const [hasSelected, setHasSelected] = useState(false); // rien ne joue tant qu'on n'a pas choisi un titre
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = hasSelected ? order[position] ?? null : null;

  useEffect(() => {
    if (isPlaying) audioRef.current?.play();
  }, [position, isPlaying]);

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
      audioRef.current?.play();
      setIsPlaying(true);
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
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

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

  return (
    <div className="h-screen overflow-hidden relative bg-base">
      <div className="h-full overflow-y-auto">
        <TrackList tracks={tracks} currentId={current?.id ?? null} onSelect={selectTrack} />
      </div>

      {current && (
        <PlayerSheet
          track={current}
          queue={order.slice(position + 1)}
          isPlaying={isPlaying}
          currentTime={currentTime}
          shuffle={shuffle}
          repeat={repeat}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onTogglePlay={togglePlay}
          onNext={playNext}
          onPrevious={playPrevious}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={() => setRepeat(!repeat)}
          onSeek={seek}
          onSelectFromQueue={selectTrack}
          audioRef={audioRef}
        />
      )}

      {current && (
        <audio
          ref={audioRef}
          src={current.audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={playNext}
        />
      )}
    </div>
  );
}
