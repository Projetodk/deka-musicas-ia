"use server";

import { createClient } from "@/lib/supabase/server";
import { uploadToDropbox } from "@/lib/dropbox";
import { revalidatePath } from "next/cache";

type ResultadoAcao = {
  success: boolean;
  message: string;
};

export async function adicionarMusica(
  formData: FormData
): Promise<ResultadoAcao> {
  const nome = (formData.get("nome") as string)?.trim();
  const artista = (formData.get("artista") as string)?.trim();
  const album = ((formData.get("album") as string) || "").trim() || null;
  const genero = ((formData.get("genero") as string) || "").trim() || null;
  const capaFile = formData.get("capa") as File | null;
  const mp3File = formData.get("mp3") as File | null;

  if (!nome || !artista || !mp3File || mp3File.size === 0) {
    return {
      success: false,
      message: "Preencha nome, artista e selecione o arquivo MP3.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Sessão expirada. Faça login novamente.",
    };
  }

  try {
    const arquivoUrl = await uploadToDropbox(mp3File, mp3File.name);

    let capaUrl: string | null = null;
    if (capaFile && capaFile.size > 0) {
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

    const { count } = await supabase
      .from("musicas")
      .select("*", { count: "exact", head: true });

    const { error: insertError } = await supabase.from("musicas").insert({
      nome,
      artista,
      album,
      genero,
      capa_url: capaUrl,
      arquivo_url: arquivoUrl,
      ordem: count ?? 0,
    });

    if (insertError) throw insertError;

    revalidatePath("/admin/dashboard");
    return { success: true, message: "Música adicionada com sucesso!" };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Algo deu errado ao salvar a música. Tente novamente.",
    };
  }
}
