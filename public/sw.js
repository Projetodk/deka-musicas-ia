const CACHE_NAME = "deka-musicas-offline-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function criarRespostaParcial(response, rangeHeader) {
  const buffer = await response.clone().arrayBuffer();
  const totalSize = buffer.byteLength;

  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match) return response;

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
  const chunk = buffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      "Content-Length": String(chunk.byteLength),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request, {
        ignoreVary: true,
        ignoreSearch: false,
      });

      if (cachedResponse) {
        const rangeHeader = request.headers.get("range");
        if (rangeHeader) {
          return criarRespostaParcial(cachedResponse, rangeHeader);
        }
        return cachedResponse;
      }

      try {
        return await fetch(request);
      } catch {
        return new Response("", { status: 504, statusText: "Offline" });
      }
    })()
  );
});
