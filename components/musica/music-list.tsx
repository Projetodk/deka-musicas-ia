"use client";

import { usePlayer, type Musica } from "@/components/player/player-context";

export default function MusicList({ musicas }: { musicas: Musica[] }) {
  const { currentIndex, isPlaying, playSong } = usePlayer();

  if (musicas.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-ink-muted">
        Nenhuma música publicada ainda.
      </p>
    );
  }

  return (
    <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-2 px-4 pb-32">
      {musicas.map((musica, index) => {
        const tocandoAgora = currentIndex === index;
        return (
          <button
            key={musica.id}
            onClick={() => playSong(index)}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-surface-elevated ${
              tocandoAgora ? "bg-surface-elevated" : "bg-surface"
            }`}
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
              <span className="shrink-0 text-xs text-accent">tocando</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
