"use server";

import { createClient } from "@/lib/supabase/server";
import { getDropboxAccessToken, criarOuBuscarLinkDireto } from "@/lib/dropbox";

export const maxDuration = 60;

async function verificarLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
}

export async function iniciarSessaoUpload(formData: FormData) {
  await verificarLogin();

  const chunk = formData.get("chunk") as Blob;
  const accessToken = await getDropboxAccessToken();
  const arrayBuffer = await chunk.arrayBuffer();

  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload_session/start",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({ close: false }),
      },
      body: arrayBuffer,
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao iniciar o envio para o Dropbox.");
  }

  const data = await response.json();
  return { sessionId: data.session_id as string };
}

export async function enviarParteUpload(formData: FormData) {
  await verificarLogin();

  const chunk = formData.get("chunk") as Blob;
  const sessionId = formData.get("sessionId") as string;
  const offset = Number(formData.get("offset"));
  const accessToken = await getDropboxAccessToken();
  const arrayBuffer = await chunk.arrayBuffer();

  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload_session/append_v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id: sessionId, offset },
          close: false,
        }),
      },
      body: arrayBuffer,
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao enviar parte do arquivo para o Dropbox.");
  }

  return { success: true };
}

export async function finalizarUpload(formData: FormData) {
  await verificarLogin();

  const chunk = formData.get("chunk") as Blob;
  const sessionId = formData.get("sessionId") as string;
  const offset = Number(formData.get("offset"));
  const nomeArquivo = formData.get("nomeArquivo") as string;
  const accessToken = await getDropboxAccessToken();
  const arrayBuffer = await chunk.arrayBuffer();

  const dropboxPath = `/${Date.now()}-${nomeArquivo}`;

  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload_session/finish",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          cursor: { session_id: sessionId, offset },
          commit: {
            path: dropboxPath,
            mode: "add",
            autorename: true,
            mute: true,
          },
        }),
      },
      body: arrayBuffer,
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao finalizar o envio para o Dropbox.");
  }

  const data = await response.json();
  const path = data.path_lower as string;

  const url = await criarOuBuscarLinkDireto(path, accessToken);
  return { url };
}
