import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "../logout-button";
import NovaMusicaForm from "./nova-musica-form";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: musicas } = await supabase
    .from("musicas")
    .select("id, nome, artista, ordem")
    .order("ordem", { ascending: true });

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            Bem-vindo, administrador
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <NovaMusicaForm />

      <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-surface p-8">
        <h2 className="text-lg font-semibold text-ink">Suas músicas</h2>

        {!musicas || musicas.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Nenhuma música cadastrada ainda.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {musicas.map((musica) => (
              <li
                key={musica.id}
                className="rounded-lg bg-surface-elevated px-4 py-3 text-sm text-ink"
              >
                <span className="font-medium">{musica.nome}</span>
                <span className="text-ink-muted"> — {musica.artista}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
