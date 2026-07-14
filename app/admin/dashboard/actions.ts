"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type DadosMusica = {
  nome: string;
  artista: string;
  album: string | null;
  genero: string | null;
  capaUrl: string | null;
  arquivoUrl: string;
};

type ResultadoAcao = {
  success: boolean;
  message: string;
};

export async function salvarMusica(
  dados: DadosMusica
): Promise<ResultadoAcao> {
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
    const { count } = await supabase
      .from("musicas")
      .select("*", { count: "exact", head: true });

    const { error: insertError } = await supabase.from("musicas").insert({
      nome: dados.nome,
      artista: dados.artista,
      album: dados.album,
      genero: dados.genero,
      capa_url: dados.capaUrl,
      arquivo_url: dados.arquivoUrl,
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
