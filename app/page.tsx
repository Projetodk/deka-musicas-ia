export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

export default async function Home() {
  let statusText = "Carregando informações...";

  try {
    const { count, error } = await supabase
      .from("musicas")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    statusText = `${count ?? 0} música(s) cadastrada(s) até agora.`;
  } catch {
    statusText = "Ainda não foi possível conectar ao banco de dados.";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface">
        <div className="ml-1 h-0 w-0 border-y-[14px] border-l-[22px] border-y-transparent border-l-accent" />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
        Deka Músicas IA
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
        Músicas criadas por inteligência artificial, compartilhadas
        gratuitamente. Ouça online ou instale o app para escutar offline,
        onde e quando quiser.
      </p>

      <p className="mt-10 text-sm text-ink-muted">{statusText}</p>
    </main>
  );
}
