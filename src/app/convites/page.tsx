import { AppShell, UserPill } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  inviteRoles,
  listRegistrationInvites,
  type InviteStatus
} from "@/lib/registration-invites";
import { uiLabel } from "@/lib/ui-labels";
import { listClasses } from "@/lib/classes";
import {
  createRegistrationInviteAction,
  revokeRegistrationInviteAction
} from "./actions";
import { CopyLinkButton } from "./copy-link-button";

type PageProps = {
  searchParams: Promise<{
    perfil?: string;
    status?: string;
    erro?: string;
    sucesso?: string;
  }>;
};

const statuses: InviteStatus[] = [
  "active",
  "expired",
  "revoked",
  "used",
  "limit_reached"
];

export default async function RegistrationInvitesPage({ searchParams }: PageProps) {
  const user = await requirePermission("invite.view");
  const params = await searchParams;
  const role = inviteRoles.includes(params.perfil as (typeof inviteRoles)[number])
    ? params.perfil
    : undefined;
  const status = statuses.includes(params.status as InviteStatus)
    ? params.status
    : undefined;
  const [invites, classes] = await Promise.all([
    listRegistrationInvites(user, { role, status }),
    listClasses(user)
  ]);
  const canCreateStudent = hasPermission(user, "invite.create_student");
  const canCreateInstructor = hasPermission(user, "invite.create_instructor");
  const canCreateAdmin = hasPermission(user, "invite.create_admin");
  const canRevoke = hasPermission(user, "invite.revoke");

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Governança de acessos</p>
          <h1 className="page-title">Links de Cadastro</h1>
          <p className="page-copy">
            Gere links seguros para cadastro de novos usuários da Escola LaBC
            de Inovação, com perfil, validade e limite de uso controlados.
          </p>
        </div>
        <UserPill user={user} />
      </section>

      {params.erro ? <p className="panel form-error">{params.erro}</p> : null}
      {params.sucesso ? <p className="panel form-success">{params.sucesso}</p> : null}

      <section className="content-grid invite-layout">
        <aside className="panel">
          <h2>Gerar novo link</h2>
          <p className="muted-small">
            A pessoa convidada definirá seu e-mail e sua senha. O perfil é
            determinado exclusivamente por este convite.
          </p>
          <form action={createRegistrationInviteAction} className="form-grid">
            <label className="field">
              <span>Perfil do novo usuário</span>
              <select defaultValue="participante" name="perfil" required>
                {canCreateStudent ? <option value="participante">Aluno</option> : null}
                {canCreateInstructor ? <option value="instrutor">Instrutor</option> : null}
                {canCreateAdmin ? (
                  <option value="administrador_geral">Administrador</option>
                ) : null}
              </select>
            </label>
            <label className="field">
              <span>Tipo de uso</span>
              <select defaultValue="unico" name="tipoUso">
                <option value="unico">Uso único</option>
                <option value="multiplo">Uso múltiplo</option>
              </select>
            </label>
            <label className="field">
              <span>Turma para Instrutor</span>
              <select defaultValue="" name="turmaInstrutoriaId">
                <option value="">Selecione para convites de Instrutor</option>
                {classes
                  .filter((item) => !["encerrada", "cancelada"].includes(item.status))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.cursoNome} - {item.nome}
                    </option>
                  ))}
              </select>
              <small>
                Convites de Instrutor exigem turma. O acesso será limitado a
                esse vínculo funcional.
              </small>
            </label>
            <label className="field">
              <span>Limite de usos</span>
              <input defaultValue="1" min="1" max="100" name="limiteUsos" type="number" />
            </label>
            <label className="field">
              <span>Validade</span>
              <select defaultValue="168" name="validadeHoras">
                <option value="24">24 horas</option>
                <option value="168">7 dias</option>
                <option value="360">15 dias</option>
                <option value="720">30 dias</option>
              </select>
            </label>
            <label className="field">
              <span>E-mail específico (opcional)</span>
              <input
                maxLength={160}
                name="emailConvidado"
                placeholder="pessoa@balneariocamboriu.sc.gov.br"
                type="email"
              />
            </label>
            <label className="field">
              <span>Observação interna (opcional)</span>
              <textarea
                maxLength={280}
                name="observacao"
                placeholder="Ex.: Convite para novo instrutor convidado"
                rows={3}
              />
            </label>
            {canCreateAdmin ? (
              <label className="invite-risk-check">
                <input name="confirmarAdministrativo" type="checkbox" />
                <span>
                  Confirmo que, ao selecionar Administrador, este link concederá
                  acesso administrativo autorizado. Links administrativos terão
                  uso único e validade máxima de 24 horas.
                </span>
              </label>
            ) : null}
            <button className="button" type="submit">
              Gerar link
            </button>
          </form>
        </aside>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Links gerados</h2>
              <p className="muted-small">
                Tokens são cifrados e exibidos apenas a usuários autorizados.
              </p>
            </div>
          </div>
          <form className="invite-filters" method="get">
            <label className="field">
              <span>Perfil</span>
              <select defaultValue={role ?? ""} name="perfil">
                <option value="">Todos</option>
                {inviteRoles.map((item) => (
                  <option key={item} value={item}>
                    {uiLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select defaultValue={status ?? ""} name="status">
                <option value="">Todos</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {uiLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <button className="button secondary" type="submit">
              Filtrar
            </button>
          </form>
          <div className="invite-list">
            {invites.length ? (
              invites.map((invite) => (
                <article className="invite-card" key={invite.id}>
                  <div className="card-heading-row">
                    <div className="action-row compact">
                      <span className="badge blue">{uiLabel(invite.role)}</span>
                      <span
                        className={
                          invite.status === "active" ? "badge" : "badge warning"
                        }
                      >
                        {uiLabel(invite.status)}
                      </span>
                    </div>
                    <small className="muted-small">Token {invite.tokenPrefix}...</small>
                  </div>
                  <dl className="definition-grid invite-facts">
                    <div>
                      <dt>Validade</dt>
                      <dd>{invite.expiresAt}</dd>
                    </div>
                    <div>
                      <dt>Usos</dt>
                      <dd>
                        {invite.usedCount} de {invite.maxUses}
                      </dd>
                    </div>
                    <div>
                      <dt>Criado por</dt>
                      <dd>{invite.creatorName}</dd>
                    </div>
                    <div>
                      <dt>E-mail restrito</dt>
                      <dd>{invite.invitedEmail ?? "Não informado"}</dd>
                    </div>
                  </dl>
                  {invite.notes ? <p className="muted-small">{invite.notes}</p> : null}
                  {invite.turmaInstrutoriaNome ? (
                    <p className="muted-small">
                      Turma vinculada: {invite.cursoInstrutoriaNome} -{" "}
                      {invite.turmaInstrutoriaNome}
                    </p>
                  ) : null}
                  {invite.uses.length ? (
                    <details className="invite-uses">
                      <summary>Ver usos ({invite.uses.length})</summary>
                      {invite.uses.map((use) => (
                        <p className="muted-small" key={`${use.email}-${use.usedAt}`}>
                          {use.name} - {use.email} - {use.usedAt}
                        </p>
                      ))}
                    </details>
                  ) : null}
                  <div className="action-row compact">
                    {invite.registrationUrl ? (
                      <>
                        <CopyLinkButton url={invite.registrationUrl} />
                        <a className="text-button" href={invite.registrationUrl}>
                          Abrir link
                        </a>
                      </>
                    ) : (
                      <span className="muted-small">Link protegido para este perfil.</span>
                    )}
                    {canRevoke && invite.status === "active" ? (
                      <form action={revokeRegistrationInviteAction}>
                        <input name="conviteId" type="hidden" value={invite.id} />
                        <button className="text-button danger" type="submit">
                          Revogar link
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="muted">
                Nenhum link encontrado. Gere um convite para iniciar o cadastro seguro.
              </p>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
