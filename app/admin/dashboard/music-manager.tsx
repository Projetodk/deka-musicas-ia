"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import MusicaItem from "./musica-item";
import { reordenarMusicas } from "./actions";

type Musica = {
  id: string;
  nome: string;
  artista: string;
  album: string | null;
  genero: string | null;
  capa_url: string | null;
  ordem: number;
};

export default function MusicManager({
  musicasIniciais,
}: {
  musicasIniciais: Musica[];
}) {
  const [musicas, setMusicas] = useState(musicasIniciais);

  useEffect(() => {
    setMusicas(musicasIniciais);
  }, [musicasIniciais]);

  function mover(index: number, direcao: "cima" | "baixo") {
    const novoIndex = direcao === "cima" ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= musicas.length) return;

    const novaLista = [...musicas];
    [novaLista[index], novaLista[novoIndex]] = [
      novaLista[novoIndex],
      novaLista[index],
    ];
    setMusicas(novaLista);
    reordenarMusicas(novaLista.map((m) => m.id));
  }

  if (musicas.length === 0) {
    return (
      <p className="mt-4 text-sm text-ink-muted">
        Nenhuma música cadastrada ainda.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {musicas.map((musica, index) => (
        <div key={musica.id} className="flex items-center gap-2">
          <div className="flex shrink-0 flex-col">
            <button
              onClick={() => mover(index, "cima")}
              disabled={index === 0}
              aria-label="Mover para cima"
              className="text-ink-muted transition hover:text-ink disabled:opacity-30"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => mover(index, "baixo")}
              disabled={index === musicas.length - 1}
              aria-label="Mover para baixo"
              className="text-ink-muted transition hover:text-ink disabled:opacity-30"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="flex-1">
            <MusicaItem musica={musica} />
          </div>
        </div>
      ))}
    </div>
  );
}
