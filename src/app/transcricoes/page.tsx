import { AppShell, UserPill } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { TranscricoesClient } from "./transcricoes-client";

export default async function TranscricoesPage() {
  const user = await requirePermission("audit.view");

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">MVP de reuniões</p>
          <h1 className="page-title">Transcrição inteligente</h1>
          <p className="page-copy">
            Envie áudios de reunião, revise falantes, aplique glossário,
            organize o texto por assuntos e exporte a versão final editável.
          </p>
        </div>
        <UserPill user={user} />
      </section>

      <TranscricoesClient />
    </AppShell>
  );
}
