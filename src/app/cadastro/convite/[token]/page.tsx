import Link from "next/link";
import { PublicBrand } from "@/components/brand-signature";
import { getPublicRegistrationInvite } from "@/lib/registration-invites";
import { uiLabel } from "@/lib/ui-labels";
import { InviteRegistrationForm } from "./registration-form";

type PageProps = {
  params: Promise<{ token: string }>;
};

const unavailableMessages = {
  invalid: "Link inválido.",
  expired: "Este link expirou.",
  revoked: "Este link foi revogado.",
  used: "Este link já foi utilizado.",
  limit_reached: "Este link atingiu o limite de cadastros."
};

export default async function InvitationRegistrationPage({ params }: PageProps) {
  const { token } = await params;
  const invite = await getPublicRegistrationInvite(token);
  const available = invite.status === "active" && invite.role;

  return (
    <main className="public-shell">
      <section className="panel public-panel invite-public-panel">
        <PublicBrand compact />
        <p className="eyebrow">Acesso por convite</p>
        <h1 className="page-title">Cadastro na Escola LaBC de Inovação</h1>
        {available ? (
          <>
            <p className="page-copy">
              Você foi convidado para criar seu acesso à Escola LaBC de
              Inovação. Preencha os dados abaixo e defina sua própria senha.
            </p>
            <div className="invite-public-summary">
              <span className="badge blue">Perfil de acesso: {uiLabel(invite.role)}</span>
              <span className="badge">Válido até {invite.expiresAt}</span>
            </div>
            {invite.turmaInstrutoriaNome ? (
              <div className="alert-card">
                <strong>Vínculo de instrutoria</strong>
                <p>
                  Este acesso de Instrutor será válido somente para a turma{" "}
                  {invite.turmaInstrutoriaNome}, do curso{" "}
                  {invite.cursoInstrutoriaNome}.
                </p>
              </div>
            ) : null}
            {invite.role === "administrador_geral" ? (
              <div className="alert-card">
                <strong>Cadastro administrativo</strong>
                <p>
                  Este convite concede acesso administrativo. Prossiga somente
                  se o convite tiver sido autorizado institucionalmente.
                </p>
              </div>
            ) : null}
            <InviteRegistrationForm
              isInstructor={invite.role === "instrutor"}
              restrictedEmail={invite.invitedEmail}
              token={token}
            />
          </>
        ) : (
          <>
            <p className="form-error">
              {unavailableMessages[invite.status as keyof typeof unavailableMessages] ??
                "Este link não está disponível."}
            </p>
            <p className="page-copy">
              Solicite um novo link ao responsável pela gestão de acessos da
              Escola LaBC.
            </p>
            <Link className="button secondary" href="/login">
              Voltar ao login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
