"use client";

import { useRef, useState } from "react";
import { adicionarMusica } from "./actions";

export default function NovaMusicaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await adicionarMusica(formData);

    setLoading(false);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    if (result.success) {
      formRef.current?.reset();
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-surface p-8">
      <h2 className="text-lg font-semibold text-ink">Adicionar música</h2>
      <p className="mt-1 text-sm text-ink-muted">
        O envio pode levar alguns segundos, principalmente para arquivos MP3
        maiores. Não feche a página enquanto estiver enviando.
      </p>

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-ink-muted">
              Nome da música *
            </label>
            <input
              name="nome"
              required
              className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-muted">
              Artista *
            </label>
            <input
              name="artista"
              required
              className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-muted">
              Álbum (opcional)
            </label>
            <input
              name="album"
              className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-muted">
              Gênero (opcional)
            </label>
            <input
              name="genero"
              className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink-muted">
            Capa (imagem, opcional)
          </label>
          <input
            type="file"
            name="capa"
            accept="image/*"
            className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink-muted">
            Arquivo MP3 *
          </label>
          <input
            type="file"
            name="mp3"
            accept="audio/mpeg,.mp3"
            required
            className="w-full rounded-lg bg-surface-elevated px-3 py-2 text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-white"
          />
        </div>

        {message && (
          <p
            className={
              message.type === "success"
                ? "text-sm text-accent"
                : "text-sm text-red-400"
            }
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 self-start rounded-lg bg-accent px-5 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Adicionar música"}
        </button>
      </form>
    </div>
  );
}
