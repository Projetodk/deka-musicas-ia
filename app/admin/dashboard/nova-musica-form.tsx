"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  iniciarSessaoUpload,
  enviarParteUpload,
  finalizarUpload,
} from "./dropbox-actions";
import { salvarMusica } from "./actions";

const TAMANHO_PARTE = 4 * 1024 * 1024; // 4MB — exigido pelo Dropbox

type Etapa =
  | "idle"
  | "enviando-mp3"
  | "gerando-link"
  | "enviando-capa"
  | "salvando";

export default function NovaMusicaForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [etapa, setEtapa] = useState<Etapa>("idle");
  const [progresso, setProgresso] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loading = etapa !== "idle";

  async function enviarMp3EmPartes(file: File): Promise<string> {
    const partes: Blob[] = [];
    for (let inicio = 0; inicio < file.size; inicio += TAMANHO_PARTE) {
      partes.push(file.slice(inicio, inicio + TAMANHO_PARTE));
    }
    if (partes.length === 0) partes.push(file.slice(0, 0));

    setProgresso(`Enviando parte 1 de ${partes.length}...`);
    const startForm = new FormData();
    startForm.append("chunk", partes[0]);
    const { sessionId } = await iniciarSessaoUpload(startForm);
    let offset = partes[0].size;

    for (let i = 1; i < partes.length - 1; i++) {
      setProgresso(`Enviando parte ${i + 1} de ${partes.length}...`);
      const form = new FormData();
      form.append("chunk", partes[i]);
      form.append("sessionId", sessionId);
      form.append("offset", String(offset));
      await enviarParteUpload(form);
      offset += partes[i].size;
    }

    const ultimaParte =
      partes.length > 1 ? partes[partes.length - 1] : new Blob([]);

    if (partes.length > 1) {
      setProgresso(`Enviando parte ${partes.length} de ${partes.length}...`);
    }

    const finishForm = new FormData();
    finishForm.append("chunk", ultimaParte);
    finishForm.append("sessionId", sessionId);
    finishForm.append("offset", String(offset));
    finishForm.append("nomeArquivo", file.name);

    const { url } = await finalizarUpload(finishForm);
    return url;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setProgresso("");

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
      setEtapa("enviando-mp3");
      const arquivoUrl = await enviarMp3EmPartes(mp3File);

      let capaUrl: string | null = null;
      if (capaFile && capaFile.size > 0) {
        setEtapa("enviando-capa");
        setProgresso("");
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
      setProgresso("");
    }
  }

  const MENSAGENS_ETAPA: Record<Etapa, string> = {
    idle: "",
    "enviando-mp3": progresso || "Enviando MP3...",
    "gerando-link": "Gerando link de reprodução...",
    "enviando-capa": "Enviando capa...",
    salvando: "Salvando música...",
  };

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
