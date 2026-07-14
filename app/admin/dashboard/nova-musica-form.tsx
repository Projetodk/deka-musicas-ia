"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obterTokenDeEnvio, gerarLinkDoArquivo } from "./dropbox-actions";
import { salvarMusica } from "./actions";

type Etapa =
  | "idle"
  | "preparando"
  | "enviando-mp3"
  | "gerando-link"
  | "enviando-capa"
  | "salvando";

const MENSAGENS_ETAPA: Record<Etapa, string> = {
  idle: "",
  preparando: "Preparando envio...",
  "enviando-mp3": "Enviando MP3 para o Dropbox...",
  "gerando-link": "Gerando link de reprodução...",
  "enviando-capa": "Enviando capa...",
  salvando: "Salvando música...",
};

export default function NovaMusicaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [etapa, setEtapa] = useState<Etapa>("idle");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loading = etapa !== "idle";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const nome = (formData.get("nome") as string)?.trim();
    const artista = (formData.get("artista") as string)?.trim();
    const album = ((formData.get("album") as string) || "").trim() || null;
    const genero = ((formData.get("genero") as string) || "").trim() || null;
    const capaFile = formData.get("capa") as File | null;
    const mp3File = formData.get("mp3") as File | null;

    if (!nome || !artista || !mp3File || mp3File.size === 0) {
      setMessage({
        type: "error",
        text: "Preencha nome, artista e selecione o arquivo MP3.",
      });
      return;
    }

    try {
      // 1) Pede um token temporário do Dropbox (não envia o arquivo ainda)
      setEtapa("preparando");
      const { accessToken } = await obterTokenDeEnvio();

      // 2) Envia o MP3 direto do navegador para o Dropbox
      setEtapa("enviando-mp3");
      const dropboxPath = `/${Date.now()}-${mp3File.name}`;

      const uploadResponse = await fetch(
        "https://content.dropboxapi.com/2/files/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
            "Dropbox-API-Arg": JSON.stringify({
              path: dropboxPath,
              mode: "add",
              autorename: true,
              mute: true,
            }),
          },
          body: mp3File,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Falha ao enviar o MP3 para o Dropbox.");
      }

      const uploadData = await uploadResponse.json();
      const pathSalvo = uploadData.path_lower as string;

      // 3) Gera o link de reprodução
      setEtapa("gerando-link");
      const { url: arquivoUrl } = await gerarLinkDoArquivo(pathSalvo);

      // 4) Envia a capa direto do navegador para o Supabase (se enviada)
      let capaUrl: string | null = null;
      if (capaFile && capaFile.size > 0) {
        setEtapa("enviando-capa");
        const supabase = createClient();
        const nomeArquivoCapa = `${Date.now()}-${capaFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from("capas")
          .upload(nomeArquivoCapa, capaFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("capas")
          .getPublicUrl(nomeArquivoCapa);

        capaUrl = publicUrlData.publicUrl;
      }

      // 5) Salva tudo no banco de dados
      setEtapa("salvando");
      const resultado = await salvarMusica({
        nome,
        artista,
        album,
        genero,
        capaUrl,
        arquivoUrl,
      });

      setMessage({
        type: resultado.success ? "success" : "error",
        text: resultado.message,
      });

      if (resultado.success) {
        formRef.current?.reset();
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: "Algo deu errado ao enviar a música. Tente novamente.",
      });
    } finally {
      setEtapa("idle");
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
        onSubmit={handleSubmit}
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

        {loading && (
          <p className="text-sm text-accent">{MENSAGENS_ETAPA[etapa]}</p>
        )}

        {!loading && message && (
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
