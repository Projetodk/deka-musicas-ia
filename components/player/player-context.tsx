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

export type RepeatMode = "off" | "all" | "one";

const CHAVE_FAVORITOS = "deka-musicas-favoritos";
const CHAVE_BAIXADAS = "deka-musicas-baixadas";
const NOME_CACHE_OFFLINE = "deka-musicas-offline-v1";

type PlayerContextType = {
  playlist: Musica[];
  currentIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  favoritos: string[];
  baixadas: string[];
  playSong: (index: number) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleFavorito: (id: string) => void;
  isFavorito: (id: string) => boolean;
  baixarMusica: (musica: Musica) => Promise<void>;
  removerDownload: (musica: Musica) => Promise<void>;
  isBaixada: (id: string) => boolean;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer deve ser usado dentro de PlayerProvider");
  }
  return ctx;
}

function indiceAleatorio(atual: number, tamanho: number): number {
  if (tamanho <= 1) return atual;
  let idx = Math.floor(Math.random() * tamanho);
  while (idx === atual) {
    idx = Math.floor(Math.random() * tamanho);
  }
  return idx;
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
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [baixadas, setBaixadas] = useState<string[]>([]);

  // Carrega favoritos e downloads salvos no aparelho, ao abrir o site
  useEffect(() => {
    try {
      const favoritosSalvos = localStorage.getItem(CHAVE_FAVORITOS);
      if (favoritosSalvos) setFavoritos(JSON.parse(favoritosSalvos));

      const baixadasSalvas = localStorage.getItem(CHAVE_BAIXADAS);
      if (baixadasSalvas) setBaixadas(JSON.parse(baixadasSalvas));
    } catch {
      // localStorage indisponível: segue sem dados salvos
    }
  }, []);

  function toggleFavorito(id: string) {
    setFavoritos((atual) => {
      const novo = atual.includes(id)
        ? atual.filter((favId) => favId !== id)
        : [...atual, id];
      try {
        localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(novo));
      } catch {
        // segue sem salvar se não for possível
      }
      return novo;
    });
  }

  function isFavorito(id: string) {
    return favoritos.includes(id);
  }

  async function baixarMusica(musica: Musica) {
    try {
      if ("caches" in window) {
        const cache = await caches.open(NOME_CACHE_OFFLINE);
        const urls = [musica.arquivo_url];
        if (musica.capa_url) urls.push(musica.capa_url);
        await Promise.all(
          urls.map((url) =>
            cache.add(url).catch((err) => {
              console.error("Erro ao guardar no cache:", url, err);
            })
          )
        );
      }
    } catch (err) {
      console.error("Erro ao baixar música para offline:", err);
    }

    setBaixadas((atual) => {
      if (atual.includes(musica.id)) return atual;
      const novo = [...atual, musica.id];
      try {
        localStorage.setItem(CHAVE_BAIXADAS, JSON.stringify(novo));
      } catch {
        // segue sem salvar se não for possível
      }
      return novo;
    });
  }

  async function removerDownload(musica: Musica) {
    try {
      if ("caches" in window) {
        const cache = await caches.open(NOME_CACHE_OFFLINE);
        await cache.delete(musica.arquivo_url);
        if (musica.capa_url) await cache.delete(musica.capa_url);
      }
    } catch {
      // segue mesmo se não conseguir limpar o cache
    }

    setBaixadas((atual) => {
      const novo = atual.filter((id) => id !== musica.id);
      try {
        localStorage.setItem(CHAVE_BAIXADAS, JSON.stringify(novo));
      } catch {
        // segue sem salvar se não for possível
      }
      return novo;
    });
  }

  function isBaixada(id: string) {
    return baixadas.includes(id);
  }

  function next() {
    setCurrentIndex((atual) => {
      if (atual === null || playlist.length === 0) return atual;
      if (shuffle) return indiceAleatorio(atual, playlist.length);
      return (atual + 1) % playlist.length;
    });
    setIsPlaying(true);
  }

  function previous() {
    setCurrentIndex((atual) => {
      if (atual === null || playlist.length === 0) return atual;
      if (shuffle) return indiceAleatorio(atual, playlist.length);
      return (atual - 1 + playlist.length) % playlist.length;
    });
    setIsPlaying(true);
  }

  function toggleRepeat() {
    setRepeatMode((atual) => {
      if (atual === "off") return "all";
      if (atual === "all") return "one";
      return "off";
    });
  }

  function toggleShuffle() {
    setShuffle((atual) => !atual);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);

    const onEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (repeatMode === "off") {
        setCurrentIndex((atual) => {
          if (atual === null) return atual;
          const ultimaSemAleatorio =
            !shuffle && atual === playlist.length - 1;
          if (ultimaSemAleatorio) {
            setIsPlaying(false);
            return atual;
          }
          setIsPlaying(true);
          if (shuffle) return indiceAleatorio(atual, playlist.length);
          return atual + 1;
        });
        return;
      }

      // repeatMode === "all"
      next();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, repeatMode, shuffle]);

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
        repeatMode,
        shuffle,
        favoritos,
        baixadas,
        playSong,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleRepeat,
        toggleShuffle,
        toggleFavorito,
        isFavorito,
        baixarMusica,
        removerDownload,
        isBaixada,
      }}
    >
      {children}
      <audio ref={audioRef} src={currentSong?.arquivo_url} preload="metadata" />
    </PlayerContext.Provider>
  );
}
