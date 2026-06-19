import { logoutAction } from "@/app/login/actions";
import { ROLES, type CurrentUser } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/permissions";
import { NavLink } from "@/components/nav-link";
import { BrandLogo } from "@/components/brand-signature";
import { uiLabel } from "@/lib/ui-labels";

const elevatedLearnerRoles = new Set<string>([
  ROLES.admin,
  ROLES.gestor,
  ROLES.instrutor,
  ROLES.moderador
]);

type NavItem = {
  href: string;
  label: string;
  permissions: string[] | null;
  participantOnly?: boolean;
  hideForParticipantOnly?: boolean;
  hideForElevatedLearners?: boolean;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Aprendizagem",
    items: [
      {
        href: "/minha-area",
        label: "Meus cursos",
        permissions: null,
        participantOnly: true
      },
      {
        href: "/catalogo",
        label: "Catálogo de cursos",
        permissions: ["courses.view"],
        participantOnly: true
      },
      {
        href: "/agenda",
        label: "Minha Agenda",
        permissions: ["calendar.view_own", "calendar.view_course", "calendar.view_institutional"]
      },
      { href: "/forum", label: "Fórum e debates", permissions: ["forums.view"] },
      {
        href: "/minha-area#participacao",
        label: "Meu progresso",
        permissions: ["attendance.view"],
        participantOnly: true
      },
      {
        href: "/certificados",
        label: "Meus certificados",
        permissions: ["certificates.view"],
        participantOnly: true
      }
    ]
  },
  {
    label: "Gestão",
    items: [
      { href: "/", label: "Dashboard", permissions: ["reports.view"] },
      { href: "/cursos", label: "Cursos", permissions: ["courses.create", "courses.edit", "courses.publish"] },
      { href: "/turmas", label: "Turmas", permissions: ["courses.publish", "enrollments.manage"] },
      { href: "/inscricoes", label: "Inscrições", permissions: ["enrollments.view"] },
      { href: "/engajamento", label: "Acompanhamento dos alunos", permissions: ["progress.view_all", "progress.view_courses_managed"] },
      {
        href: "/avaliacoes",
        label: "Avaliações e Certificação",
        permissions: [
          "evaluations.view_all",
          "evaluations.view_own_class",
          "evaluations.respond_course_feedback",
          "quizzes.respond",
          "certification.view_own_requirements"
        ]
      },
      { href: "/encontros", label: "Aulas", permissions: ["classes.create", "classes.edit"] },
      {
        href: "/presencas",
        label: "Frequência",
        permissions: ["attendance.view"],
        hideForParticipantOnly: true
      },
      {
        href: "/materiais",
        label: "Materiais",
        permissions: ["materials.manage_all", "materials.view_own_class"]
      },
      { href: "/certificados", label: "Certificados", permissions: ["certificates.issue", "certificates.cancel"] }
    ]
  },
  {
    label: "Governança",
    items: [
      { href: "/usuarios", label: "Usuários", permissions: ["users.view"] },
      { href: "/convites", label: "Links de Cadastro", permissions: ["invite.view"] },
      { href: "/perfis", label: "Perfis e permissões", permissions: ["roles.view"] },
      { href: "/configuracoes", label: "Configurações", permissions: ["settings.manage"] },
      { href: "/auditoria", label: "Logs e auditoria", permissions: ["audit.view"] },
      { href: "/perfil", label: "Meu perfil", permissions: null },
      { href: "/certificados/validar", label: "Validar certificado", permissions: null }
    ]
  }
];

function PrimaryNavigation({
  groups,
  className = ""
}: {
  groups: typeof navGroups;
  className?: string;
}) {
  return (
    <nav className={`nav-list ${className}`.trim()} aria-label="Navegação principal">
      {groups.map((group) => (
        <details className="nav-group" key={group.label} open>
          <summary className="nav-group-label">{group.label}</summary>
          {group.items.map((item) => (
            <NavLink href={item.href} key={item.href} label={item.label} />
          ))}
        </details>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  const isParticipantOnly =
    user.perfis.includes(ROLES.participante) &&
    !user.perfis.some((perfil) => elevatedLearnerRoles.has(perfil));
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.participantOnly || isParticipantOnly) &&
          (!item.hideForParticipantOnly || !isParticipantOnly) &&
          (!item.hideForElevatedLearners || isParticipantOnly) &&
          (!item.permissions || hasAnyPermission(user, item.permissions))
      )
    }))
    .filter((group) => group.items.length);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <BrandLogo className="brand-logo" priority sizes="(max-width: 680px) 84px, 190px" />
          <div>
            <h1 className="brand-title">Escola LaBC de Inovação</h1>
            <p className="brand-subtitle">
              Do conhecimento à ação. Do presente ao futuro.
            </p>
          </div>
        </div>
        <PrimaryNavigation className="desktop-navigation" groups={visibleGroups} />
        <details className="mobile-navigation">
          <summary>
            <strong>Menu principal</strong>
            <span>Exibir opções</span>
          </summary>
          <PrimaryNavigation groups={visibleGroups} />
        </details>
        <UserPill user={user} compact />
        <form action={logoutAction} className="logout-form">
          <button type="submit">Sair</button>
        </form>
        <div className="sidebar-signature" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export function UserPill({
  user,
  compact = false
}: {
  user: CurrentUser;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "profile-pill compact" : "profile-pill"}>
      <strong>{user.nome}</strong>
      <span>{user.perfis.map((perfil) => uiLabel(perfil)).join(", ")}</span>
    </div>
  );
}
