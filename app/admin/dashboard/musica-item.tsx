"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarMusica, excluirMusica } from "./actions";

type Musica = {
  id: string;
  nome: string;
  artista: string;
  album: string | null;
  genero: string | null;
  capa_url: string | null;
  ordem: number;
};

function sanitizarNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

export default function MusicaItem({ musica }: { musica: Musica }) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState(musica.nome);
  const [artista, setArtista] = useState(musica.artista);
  const [album, setAlbum] = useState(musica.album ?? "");
  const [genero, setGenero] = useState(musica.genero ?? "");
  const [novaCapa, setNovaCapa] = useState<File | null>(null);

  async function handleSalvar() {
    setErro("");
    if (!nome.trim() || !artista.trim()) {
      setErro("Nome e artista são obrigatórios.");
      return;
    }

    setSalvando(true);
    try {
      let capaUrl: string | undefined = undefined;

      if (novaCapa) {
        const supabase = createClient();
        const nomeArquivoCapa = `${Date.now()}-${sanitizarNomeArquivo(
          novaCapa.name
        )}`;
        const { error: uploadError } = await supabase.storage
          .from("capas")
          .upload(nomeArquivoCapa, novaCapa);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("capas")
          .getPublicUrl(nomeArquivoCapa);

        capaUrl = publicUrlData.publicUrl;
      }

      const resultado = await atualizarMusica(musica.id, {
        nome: nome.trim(),
        artista: artista.trim(),
        album: album.trim() || null,
        genero: genero.trim() || null,
        ...(capaUrl !== undefined ? { capaUrl } : {}),
      });

      if (!resultado.success) {
        setErro(resultado.message);
        setSalvando(false);
        return;
      }

      setEditando(false);
      setSalvando(false);
    } catch (err) {
      console.error(err);
      setErro("Algo deu errado ao salvar. Tente novamente.");
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    const confirmado = window.confirm(
      `Tem certeza que quer excluir "${musica.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setExcluindo(true);
    await excluirMusica(musica.id);
  }

  if (editando) {
    return (
      <div className="rounded-lg bg-surface-elevated p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-ink-muted">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-muted">
              Artista
            </label>
            <input
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              className="w-full rounded-lg bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-muted">
              Álbum
            </label>
            <input
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full rounded-lg bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-muted">
              Gênero
            </label>
            <input
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className="w-full rounded-lg bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs text-ink-muted">
            Trocar capa (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNovaCapa(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-white"
          />
        </div>

        {erro && <p className="mt-2 text-xs text-red-400">{erro}</p>}

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button
            onClick={() => setEditando(false)}
            disabled={salvando}
            className="rounded-lg bg-surface px-4 py-1.5 text-sm text-ink-muted transition hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-elevated px-4 py-3 text-sm text-ink">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface">
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
        <p className="truncate font-medium">{musica.nome}</p>
        <p className="truncate text-xs text-ink-muted">{musica.artista}</p>
      </div>
      <button
        onClick={() => setEditando(true)}
        className="shrink-0 rounded-lg px-3 py-1 text-xs text-ink-muted transition hover:bg-surface hover:text-ink"
      >
        Editar
      </button>
      <button
        onClick={handleExcluir}
        disabled={excluindo}
        className="shrink-0 rounded-lg px-3 py-1 text-xs text-red-400 transition hover:bg-surface disabled:opacity-60"
      >
        {excluindo ? "Excluindo..." : "Excluir"}
      </button>
    </div>
  );
}
