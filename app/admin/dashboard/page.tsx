import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "../logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Bem-vindo, administrador</h1>
          <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-surface p-8 text-center text-ink-muted">
        Em breve: aqui você vai poder adicionar, editar e organizar suas músicas.
      </div>
    </main>
  );
}
