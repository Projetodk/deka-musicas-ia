export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import {
  PlayerProvider,
  type Musica,
} from "@/components/player/player-context";
import MusicList from "@/components/musica/music-list";
import PlayerBar from "@/components/player/player-bar";

export default async function Home() {
  const { data } = await supabase
    .from("musicas")
    .select("id, nome, artista, album, genero, capa_url, arquivo_url")
    .order("ordem", { ascending: true });

  const musicas: Musica[] = data ?? [];

  return (
    <PlayerProvider playlist={musicas}>
      <main className="min-h-screen pb-24">
        <div className="flex flex-col items-center px-6 pb-8 pt-16 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
            <div className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
            Deka Músicas IA
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
            Músicas criadas por inteligência artificial, compartilhadas
            gratuitamente. Ouça online ou instale o app para escutar offline.
          </p>
        </div>

        <MusicList musicas={musicas} />
      </main>

      <PlayerBar />
    </PlayerProvider>
  );
}
