import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { listCertificates, listConclusionApprovals } from "@/lib/certificates";
import { listEnrollments } from "@/lib/enrollments";
import { hasPermission } from "@/lib/permissions";
import {
  approveConclusionAction,
  cancelCertificateAction,
  issueCertificateAction
} from "./actions";

export default async function CertificatesPage() {
  const user = await requirePermission("certificates.view");
  const [certificates, enrollments] = await Promise.all([
    listCertificates(user),
    listEnrollments({ user })
  ]);
  const canIssueCertificate = hasPermission(user, "certificates.issue");
  const canCancelCertificate = hasPermission(user, "certificates.cancel");
  const pendingConclusions = canIssueCertificate
    ? await listConclusionApprovals(user)
    : [];
  const canceledEnrollmentIds = new Set(
    certificates
      .filter((item) => item.status === "cancelado")
      .map((item) => `${item.participante}-${item.curso}-${item.turma}`)
  );
  const validEnrollmentIds = new Set(
    certificates
      .filter((item) => item.status === "valido")
      .map((item) => `${item.participante}-${item.curso}-${item.turma}`)
  );
  const eligible = enrollments.filter(
    (item) =>
      item.aptoCertificado &&
      item.status !== "cancelado" &&
      !validEnrollmentIds.has(`${item.participante}-${item.curso}-${item.turma}`)
  );
  const certificateStatusLabel = (status: string) =>
    status === "valido" ? "Válido" : status === "cancelado" ? "Cancelado" : status;

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface certificate-hero">
        <div>
          <p className="eyebrow">Certificação institucional</p>
          <h1 className="page-title">Certificados LaBC</h1>
          <p className="page-copy">
            Emita, acompanhe e valide certificados com rastreabilidade,
            transparência administrativa e linguagem institucional.
          </p>
          <div className="hero-actions">
            <a className="button secondary" href="/certificados/validar">
              Validar certificado
            </a>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          {canIssueCertificate && pendingConclusions.length ? (
            <div className="alert-card">
              <strong>
                {pendingConclusions.length}{" "}
                {pendingConclusions.length > 1 ? "conclusões" : "conclusão"} aguardando aprovação
              </strong>
              <p>
                Revise os alunos que concluíram 100% das aulas e aprove para
                emitir automaticamente o certificado.
              </p>
            </div>
          ) : null}
          <h2>Certificados emitidos</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Curso</th>
                <th>Código</th>
                <th>Emissão</th>
                <th>Status</th>
                <th>PDF</th>
                <th>Cancelamento</th>
              </tr>
            </thead>
            <tbody>
              {certificates.length ? (
                certificates.map((item) => (
                  <tr key={item.id}>
                    <td>{item.participante}</td>
                    <td>
                      {item.curso}
                      <br />
                      <span className="muted-small">{item.turma}</span>
                    </td>
                    <td>{item.codigoValidacao}</td>
                    <td>{item.dataEmissao}</td>
                    <td>
                      <span
                        className={
                          item.status === "valido" ? "badge" : "badge warning"
                        }
                      >
                        {certificateStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <a className="table-link" href={`/api/certificados/${item.id}/pdf`}>
                        Baixar
                      </a>
                    </td>
                    <td>
                      {item.status === "cancelado" ? (
                        <span className="muted-small">
                          {item.dataCancelamento}
                          <br />
                          {item.motivoCancelamento}
                        </span>
                      ) : canCancelCertificate ? (
                        <form className="inline-form" action={cancelCertificateAction}>
                          <input name="certificadoId" type="hidden" value={item.id} />
                          <input
                            name="motivo"
                            placeholder="Motivo"
                            aria-label="Motivo do cancelamento"
                          />
                          <button className="text-button danger" type="submit">
                            Cancelar
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>Nenhum certificado emitido.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {canIssueCertificate ? (
        <aside className="panel">
          <h2>Alertas de conclusão</h2>
          <div className="stack-list">
            {pendingConclusions.length ? (
              pendingConclusions.map((item) => (
                <article className="list-card" key={item.inscricaoId}>
                  <div className="card-heading-row">
                    <strong>{item.participante}</strong>
                    <span className="badge blue">100%</span>
                  </div>
                  <span>
                    {item.curso}
                    <br />
                    <span className="muted-small">
                      {item.turma} - concluído em{" "}
                      {item.concluidoEm ?? item.ultimoAcesso ?? "data não registrada"}
                    </span>
                  </span>
                  <form action={approveConclusionAction}>
                    <input name="inscricaoId" type="hidden" value={item.inscricaoId} />
                    <button className="button highlight" type="submit">
                      Aprovar e emitir certificado
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <p className="muted-small">
                Nenhuma conclusão pendente de aprovação no momento.
              </p>
            )}
          </div>

          <h2>Emitir certificado</h2>
          <form className="form-grid" action={issueCertificateAction}>
            <div className="field">
              <label htmlFor="inscricaoId">Inscrição apta</label>
              <select id="inscricaoId" name="inscricaoId" required>
                {eligible.map((item) => (
                  <option key={item.id} value={item.id}>
                    {canceledEnrollmentIds.has(
                      `${item.participante}-${item.curso}-${item.turma}`
                    )
                      ? "Reemitir"
                      : "Emitir"}{" "}
                    - {item.participante} - {item.curso}
                  </option>
                ))}
              </select>
            </div>
            <button className="button" type="submit" disabled={!eligible.length}>
              Emitir certificado
            </button>
          </form>
        </aside>
        ) : null}
      </section>
    </AppShell>
  );
}
