"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
} from "lucide-react";
import { usePlayer } from "@/components/player/player-context";

function formatarTempo(segundos: number): string {
  if (!isFinite(segundos) || segundos < 0) return "0:00";
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export default function PlayerBar() {
  const {
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    toggleFavorito,
    isFavorito,
  } = usePlayer();

  if (currentIndex === null) return null;

  const musica = playlist[currentIndex];

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-surface-elevated bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-elevated">
          {musica.capa_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={musica.capa_url}
              alt={musica.nome}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="hidden w-24 min-w-0 shrink-0 sm:block sm:w-40">
          <p className="truncate text-sm font-medium text-ink">
            {musica.nome}
          </p>
          <p className="truncate text-xs text-ink-muted">{musica.artista}</p>
        </div>

        <button
          onClick={() => toggleFavorito(musica.id)}
          aria-label="Favoritar"
          className="hidden shrink-0 text-ink-muted transition hover:text-accent-secondary sm:block"
        >
          <Heart
            size={16}
            fill={isFavorito(musica.id) ? "currentColor" : "none"}
            className={isFavorito(musica.id) ? "text-accent-secondary" : ""}
          />
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleShuffle}
              aria-label="Aleatório"
              className={`transition hover:text-ink ${
                shuffle ? "text-accent" : "text-ink-muted"
              }`}
            >
              <Shuffle size={16} />
            </button>
            <button
              onClick={previous}
              aria-label="Anterior"
              className="text-ink-muted transition hover:text-ink"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white transition hover:opacity-90"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              aria-label="Próxima"
              className="text-ink-muted transition hover:text-ink"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              onClick={toggleRepeat}
              aria-label="Repetir"
              className={`transition hover:text-ink ${
                repeatMode !== "off" ? "text-accent" : "text-ink-muted"
              }`}
            >
              {repeatMode === "one" ? (
                <Repeat1 size={16} />
              ) : (
                <Repeat size={16} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-right text-[11px] text-ink-muted">
              {formatarTempo(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-accent"
            />
            <span className="w-9 shrink-0 text-[11px] text-ink-muted">
              {formatarTempo(duration)}
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Volume2 size={16} className="text-ink-muted" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-20 cursor-pointer accent-accent"
          />
        </div>
      </div>
    </div>
  );
}
