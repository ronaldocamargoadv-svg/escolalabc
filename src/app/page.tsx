import { AppShell, UserPill } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { listConclusionApprovals } from "@/lib/certificates";
import { listCourses } from "@/lib/courses";
import { hasPermission } from "@/lib/permissions";
import { getDashboardMetrics, getRecentActivity } from "@/lib/reports";
import { uiLabel } from "@/lib/ui-labels";
import { getInstructorAccessSummary } from "@/lib/instructor-assignments";

export default async function Home() {
  const user = await requireCurrentUser();

  if (!hasPermission(user, "reports.view")) {
    redirect("/minha-area");
  }

  const isInstructor = user.perfis.some((perfil) =>
    perfil.toLowerCase().includes("instrutor")
  );
  const instructorAccess = isInstructor
    ? await getInstructorAccessSummary(user.id)
    : null;
  const canApproveCertificates = hasPermission(user, "certificates.issue");
  const [metrics, recentActivity, courses, pendingConclusions] = await Promise.all([
    getDashboardMetrics(user),
    getRecentActivity(user),
    listCourses(user),
    canApproveCertificates ? listConclusionApprovals(user) : Promise.resolve([])
  ]);

  const metricCards = [
    { label: "Cursos mapeados", value: metrics.cursos },
    { label: "Alunos inscritos", value: metrics.inscricoes },
    { label: "Certificados emitidos", value: metrics.certificados },
    { label: "Horas formativas", value: metrics.cargaHoraria }
  ];
  const canManageCourses = hasPermission(user, "courses.edit");
  const canExportExecutive = hasPermission(user, "reports.export");
  const dashboardTitle = isInstructor
    ? "Painel do instrutor"
    : "Painel estratégico da Escola LaBC de Inovação";
  const dashboardCopy = isInstructor
    ? "Acompanhe cursos sob sua responsabilidade, próximas aulas, participação dos alunos e pendências operacionais da turma."
    : "Monitore cursos, turmas, inscrições, frequência, certificados e sinais de evolução institucional da aprendizagem.";
  const insightCards = isInstructor
    ? [
        {
          eyebrow: "Aulas",
          title: "Preparar próximos encontros",
          copy: "Revise materiais, registre comunicados e antecipe pendências de presença."
        },
        {
          eyebrow: "Turmas",
          title: "Acompanhar participação",
          copy: "Observe inscrições, progresso e frequência dentro do seu escopo."
        },
        {
          eyebrow: "Comunidade",
          title: "Responder debates",
          copy: "Mantenha as discussões conectadas aos objetivos da experiência formativa."
        }
      ]
    : [
        {
          eyebrow: "Jornadas",
          title: "Trilhas e laboratórios formativos",
          copy: "Organize experiências por tema, modalidade e etapa de aprendizagem."
        },
        {
          eyebrow: "Governança",
          title: "Dados para tomada de decisão",
          copy: "Use relatórios, frequência e certificados para orientar a gestão."
        },
        {
          eyebrow: "Comunidade",
          title: "Debates com rastro institucional",
          copy: "Fortaleça a colaboração entre alunos, instrutores e administradores."
        }
      ];
  const priorityItems = isInstructor
    ? [
        "Lançar ou revisar frequência das aulas recentes",
        "Publicar material de apoio para a próxima aula",
        "Responder dúvidas abertas no debate da turma",
        "Acompanhar alunos com baixa participação"
      ]
    : [
        "Verificar cursos ativos e turmas com inscrições abertas",
        "Acompanhar certificados aptos para emissão",
        "Revisar perfis, permissões e acessos sensíveis",
        "Consultar auditoria de ações administrativas"
      ];
  const quickActions = isInstructor
    ? [
        {
          icon: "CU",
          title: "Meus cursos",
          copy: "Ver cursos e turmas sob sua responsabilidade.",
          href: "/encontros",
          permission: "reports.view"
        },
        {
          icon: "AL",
          title: "Meus alunos",
          copy: "Consultar inscritos das suas turmas.",
          href: "/inscricoes",
          permission: "enrollments.view"
        },
        {
          icon: "PR",
          title: "Acompanhar progresso",
          copy: "Identificar alunos iniciados, concluídos e pendentes.",
          href: "/engajamento",
          permission: "progress.view_courses_managed"
        },
        {
          icon: "FR",
          title: "Registrar frequência",
          copy: "Registrar frequência em aulas presenciais ou híbridas.",
          href: "/presencas",
          permission: "attendance.manage"
        },
        {
          icon: "MT",
          title: "Publicar material",
          copy: "Adicionar links, documentos e vídeos de apoio.",
          href: "/materiais",
          permission: "materials.view_own_class"
        },
        {
          icon: "AG",
          title: "Minha Agenda",
          copy: "Organizar aulas, compromissos e prazos das suas turmas.",
          href: "/agenda",
          permission: "calendar.view_own"
        },
        {
          icon: "DB",
          title: "Fórum da turma",
          copy: "Responder dúvidas e abrir discussões formativas.",
          href: "/forum",
          permission: "forums.post"
        }
      ]
    : [
        {
          icon: "CU",
          title: "Gerenciar cursos",
          copy: "Criar, editar, publicar e arquivar cursos.",
          href: "/cursos",
          permission: "courses.edit"
        },
        {
          icon: "TU",
          title: "Gerenciar turmas",
          copy: "Organizar ofertas, vagas, períodos e instrutores.",
          href: "/turmas",
          permission: "enrollments.manage"
        },
        {
          icon: "AL",
          title: "Acompanhamento dos alunos",
          copy: "Ver progresso, acessos, frequência e pendências.",
          href: "/engajamento",
          permission: "progress.view_all"
        },
        {
          icon: "CE",
          title: "Gerenciar certificados",
          copy: "Aprovar, emitir, cancelar e reemitir certificados.",
          href: "/certificados",
          permission: "certificates.issue"
        },
        {
          icon: "US",
          title: "Gerenciar usuários",
          copy: "Cadastrar, ativar, inativar e vincular perfis.",
          href: "/usuarios",
          permission: "users.view"
        },
        {
          icon: "LI",
          title: "Links de Cadastro",
          copy: "Convidar novos alunos, instrutores e administradores.",
          href: "/convites",
          permission: "invite.view"
        },
        {
          icon: "AG",
          title: "Agenda Institucional",
          copy: "Planejar eventos, aulas e prazos da Escola LaBC.",
          href: "/agenda",
          permission: "calendar.view_institutional"
        },
        {
          icon: "RE",
          title: "Exportar relatório",
          copy: "Exportar indicadores de cursos, turmas e certificados.",
          href: "/api/relatorios/executivo.csv",
          permission: "reports.export"
        }
      ];
  const visibleQuickActions = quickActions.filter((item) =>
    hasPermission(user, item.permission)
  );

  if (isInstructor && instructorAccess && !instructorAccess.canOperate && !instructorAccess.agendado) {
    return (
      <AppShell user={user}>
        <section className="topbar hero-surface">
          <div>
            <p className="eyebrow">Vínculo de instrutoria</p>
            <h1 className="page-title">Nenhuma turma ativa vinculada</h1>
            <p className="page-copy">
              Você não possui, neste momento, turma ativa vinculada como
              Instrutor na Escola LaBC de Inovação.
            </p>
            {instructorAccess.concluido || instructorAccess.expirado ? (
              <p className="page-copy">
                Você pode consultar seu histórico de turmas encerradas, mas
                não possui permissões de atuação nessas turmas.
              </p>
            ) : null}
            <div className="hero-actions">
              <a className="button" href="/minhas-turmas">
                Ver histórico de turmas
              </a>
              <a className="button secondary" href="/perfil">
                Meu perfil
              </a>
            </div>
          </div>
          <UserPill user={user} />
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">{isInstructor ? "Condução das aulas" : "Inteligência institucional"}</p>
          <h1 className="page-title">{dashboardTitle}</h1>
          <p className="page-copy">{dashboardCopy}</p>
          <div className="hero-actions">
            {!isInstructor && canManageCourses ? (
              <a className="button" href="/cursos">
                Criar curso
              </a>
            ) : null}
            {isInstructor ? (
              <a className="button" href="/engajamento">
                Acompanhar progresso
              </a>
            ) : (
              <a className="button secondary" href="/forum">
                Moderar debates
              </a>
            )}
          </div>
        </div>
        <UserPill user={user} />
      </section>

      <section className="metric-grid" aria-label="Indicadores">
        {metricCards.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="persona-action-grid" aria-label="Ações principais">
        {visibleQuickActions.map((action) => (
          <a className="persona-action-card" href={action.href} key={action.title}>
            <span className="action-icon" aria-hidden="true">
              {action.icon}
            </span>
            <strong>{action.title}</strong>
            <p>{action.copy}</p>
          </a>
        ))}
      </section>

      {canApproveCertificates && pendingConclusions.length ? (
        <section className="panel">
          <div className="alert-card">
            <strong>
              {pendingConclusions.length}{" "}
              {pendingConclusions.length > 1 ? "conclusões" : "conclusão"} aguardando aprovação
            </strong>
            <p>
              Há aluno com progresso concluído aguardando validação da
              administração. Ao aprovar, o certificado será emitido
              automaticamente.
            </p>
          </div>
          <div className="action-row compact">
            <a className="button" href="/certificados">
              Aprovar conclusões
            </a>
            <a className="button secondary" href="/engajamento?status=completed">
              Ver engajamento
            </a>
          </div>
        </section>
      ) : null}

      <section className="insight-strip" aria-label="Atalhos operacionais">
        {insightCards.map((card) => (
          <article key={card.title}>
            <span>{card.eyebrow}</span>
            <strong>{card.title}</strong>
            <p>{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>{isInstructor ? "Meus cursos e turmas" : "Cursos em acompanhamento"}</h2>
              <p className="muted-small">
                Visão consolidada das ofertas formativas vinculadas ao seu perfil.
              </p>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Modalidade</th>
                <th>Carga</th>
                <th>Status</th>
                <th>Turmas</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.nome}</td>
                  <td>{uiLabel(course.modalidade)}</td>
                  <td>{course.cargaHoraria}h</td>
                  <td>
                    <span
                      className={
                        course.status === "publicado"
                          ? "badge"
                          : "badge warning"
                      }
                    >
                      {uiLabel(course.status)}
                    </span>
                  </td>
                  <td>{course.turmas}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="action-row">
            {canManageCourses ? (
              <a className="button" href="/cursos">
                Gerenciar cursos
              </a>
            ) : null}
            {canExportExecutive ? (
              <a className="button secondary" href="/api/relatorios/executivo.csv">
                Exportar CSV
              </a>
            ) : null}
            <a className="button secondary" href="/certificados/validar">
              Validar certificado
            </a>
          </div>
        </div>

        <aside className="panel">
          <h2>{isInstructor ? "Foco da semana" : "Prioridades de gestão"}</h2>
          <ul className="checklist">
            {priorityItems.map((item) => (
              <li key={item}>
                <span className="check">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <h2 style={{ marginTop: 24 }}>Atividade recente</h2>
          <ul className="checklist">
            {recentActivity.map((item) => (
              <li key={`${item.label}-${item.value}`}>
                <span className="check">OK</span>
                <span>
                  <strong>{item.label}</strong>
                  <br />
                  {item.value} - {uiLabel(item.detail)}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </AppShell>
  );
}
