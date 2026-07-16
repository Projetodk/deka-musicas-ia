"use client";

import { useState } from "react";
import { Heart, Download, Check, Loader2 } from "lucide-react";
import { usePlayer, type Musica } from "@/components/player/player-context";

export default function MusicList({ musicas }: { musicas: Musica[] }) {
  const {
    currentIndex,
    isPlaying,
    playSong,
    isFavorito,
    toggleFavorito,
    isBaixada,
    baixarMusica,
    removerDownload,
  } = usePlayer();
  const [somenteFavoritas, setSomenteFavoritas] = useState(false);
  const [baixando, setBaixando] = useState<Set<string>>(new Set());

  if (musicas.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-ink-muted">
        Nenhuma música publicada ainda.
      </p>
    );
  }

  const listaExibida = somenteFavoritas
    ? musicas.filter((m) => isFavorito(m.id))
    : musicas;

  async function handleDownload(musica: Musica) {
    if (isBaixada(musica.id)) {
      await removerDownload(musica);
      return;
    }
    setBaixando((atual) => new Set(atual).add(musica.id));
    await baixarMusica(musica);
    setBaixando((atual) => {
      const novo = new Set(atual);
      novo.delete(musica.id);
      return novo;
    });
  }

  return (
    <div className="mx-auto mt-6 max-w-3xl px-4 pb-32">
      <div className="mb-3 flex justify-center gap-2">
        <button
          onClick={() => setSomenteFavoritas(false)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !somenteFavoritas
              ? "bg-accent text-white"
              : "bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setSomenteFavoritas(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            somenteFavoritas
              ? "bg-accent text-white"
              : "bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          Favoritas
        </button>
      </div>

      {listaExibida.length === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-muted">
          Nenhuma música favoritada ainda. Toque no coração de uma música
          para adicionar.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {listaExibida.map((musica) => {
            const index = musicas.findIndex((m) => m.id === musica.id);
            const tocandoAgora = currentIndex === index;
            const estaBaixando = baixando.has(musica.id);
            const jaBaixada = isBaixada(musica.id);

            return (
              <div
                key={musica.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-surface-elevated ${
                  tocandoAgora ? "bg-surface-elevated" : "bg-surface"
                }`}
              >
                <button
                  onClick={() => playSong(index)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
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
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        tocandoAgora ? "text-accent" : "text-ink"
                      }`}
                    >
                      {musica.nome}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {musica.artista}
                    </p>
                  </div>
                  {tocandoAgora && isPlaying && (
                    <span className="shrink-0 text-xs text-accent">
                      tocando
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(musica)}
                  disabled={estaBaixando}
                  aria-label={
                    jaBaixada ? "Remover download" : "Baixar para offline"
                  }
                  className={`shrink-0 transition ${
                    jaBaixada
                      ? "text-accent"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  title={
                    jaBaixada
                      ? "Disponível offline (toque para remover)"
                      : "Baixar para ouvir offline"
                  }
                >
                  {estaBaixando ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : jaBaixada ? (
                    <Check size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                </button>

                <button
                  onClick={() => toggleFavorito(musica.id)}
                  aria-label="Favoritar"
                  className="shrink-0 text-ink-muted transition hover:text-accent-secondary"
                >
                  <Heart
                    size={18}
                    fill={isFavorito(musica.id) ? "currentColor" : "none"}
                    className={
                      isFavorito(musica.id) ? "text-accent-secondary" : ""
                    }
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
