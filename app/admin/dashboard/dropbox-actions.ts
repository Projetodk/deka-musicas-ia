"use server";

import { createClient } from "@/lib/supabase/server";
import { getDropboxAccessToken, criarOuBuscarLinkDireto } from "@/lib/dropbox";

async function verificarLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
}

export async function obterTokenDeEnvio() {
  await verificarLogin();
  const accessToken = await getDropboxAccessToken();
  return { accessToken };
}

export async function gerarLinkDoArquivo(path: string) {
  await verificarLogin();
  const accessToken = await getDropboxAccessToken();
  const url = await criarOuBuscarLinkDireto(path, accessToken);
  return { url };
}
