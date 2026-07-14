async function getAccessToken(): Promise<string> {
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN!,
      client_id: process.env.DROPBOX_APP_KEY!,
      client_secret: process.env.DROPBOX_APP_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível autenticar com o Dropbox.");
  }

  const data = await response.json();
  return data.access_token as string;
}

function toDirectUrl(shareUrl: string): string {
  return shareUrl.replace("dl=0", "dl=1");
}

async function getOrCreateDirectLink(
  path: string,
  accessToken: string
): Promise<string> {
  const createResponse = await fetch(
    "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    }
  );

  if (createResponse.ok) {
    const data = await createResponse.json();
    return toDirectUrl(data.url as string);
  }

  // Se o link já existia, busca o link já criado antes
  const listResponse = await fetch(
    "https://api.dropboxapi.com/2/sharing/list_shared_links",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, direct_only: true }),
    }
  );

  if (!listResponse.ok) {
    throw new Error("Não foi possível gerar o link do arquivo no Dropbox.");
  }

  const listData = await listResponse.json();
  const existingUrl = listData.links?.[0]?.url as string | undefined;

  if (!existingUrl) {
    throw new Error(
      "Não foi possível encontrar o link do arquivo no Dropbox."
    );
  }

  return toDirectUrl(existingUrl);
}

export async function uploadToDropbox(
  file: File,
  fileName: string
): Promise<string> {
  const accessToken = await getAccessToken();
  const arrayBuffer = await file.arrayBuffer();

  const dropboxPath = `/${Date.now()}-${fileName}`;

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
      body: arrayBuffer,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Falha ao enviar arquivo para o Dropbox: ${errorText}`);
  }

  const uploadData = await uploadResponse.json();
  const path = uploadData.path_lower as string;

  return await getOrCreateDirectLink(path, accessToken);
}
