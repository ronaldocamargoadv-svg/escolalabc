import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";

export default async function ForbiddenPage() {
  const user = await requireCurrentUser();

  return (
    <AppShell user={user}>
      <section className="panel public-panel">
        <p className="eyebrow">Acesso restrito</p>
        <h1 className="page-title">Permissão necessária</h1>
        <p className="page-copy">
          Seu perfil atual não possui permissão para acessar esta funcionalidade.
          Caso a atribuição esteja incorreta, solicite revisão a um administrador
          da plataforma.
        </p>
        <div className="action-row">
          <Link className="button" href="/minha-area">
            Ir para minha área
          </Link>
          <Link className="button secondary" href="/catalogo">
            Ver catálogo
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
