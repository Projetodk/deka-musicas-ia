"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Musica = {
  id: string;
  nome: string;
  artista: string;
  album: string | null;
  genero: string | null;
  capa_url: string | null;
  arquivo_url: string;
};

type PlayerContextType = {
  playlist: Musica[];
  currentIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playSong: (index: number) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer deve ser usado dentro de PlayerProvider");
  }
  return ctx;
}

export function PlayerProvider({
  playlist,
  children,
}: {
  playlist: Musica[];
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  function next() {
    setCurrentIndex((atual) => {
      if (atual === null || playlist.length === 0) return atual;
      return (atual + 1) % playlist.length;
    });
    setIsPlaying(true);
  }

  function previous() {
    setCurrentIndex((atual) => {
      if (atual === null || playlist.length === 0) return atual;
      return (atual - 1 + playlist.length) % playlist.length;
    });
    setIsPlaying(true);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => next();

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || currentIndex === null) return;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  function playSong(index: number) {
    setCurrentIndex(index);
    setIsPlaying(true);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || currentIndex === null) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  function seek(time: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }

  function setVolume(v: number) {
    const audio = audioRef.current;
    setVolumeState(v);
    if (audio) audio.volume = v;
  }

  const currentSong = currentIndex !== null ? playlist[currentIndex] : null;

  return (
    <PlayerContext.Provider
      value={{
        playlist,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playSong,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
      }}
    >
      {children}
      <audio ref={audioRef} src={currentSong?.arquivo_url} preload="metadata" />
    </PlayerContext.Provider>
  );
}
