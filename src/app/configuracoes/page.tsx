import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";

const settings = [
  {
    title: "Identidade visual",
    copy: "Marca Escola LaBC de Inovação, cores institucionais e padrão visual dos certificados."
  },
  {
    title: "Dados institucionais",
    copy: "Nome da escola, vinculação municipal, unidade responsável e textos oficiais."
  },
  {
    title: "Regras de certificação",
    copy: "Critérios gerais de frequência, conclusão, emissão e reemissão."
  },
  {
    title: "Textos padrão",
    copy: "Mensagens institucionais para cursos, certificados, avisos e comunicados."
  }
];

export default async function SettingsPage() {
  const user = await requirePermission("settings.manage");

  return (
    <AppShell user={user}>
      <section className="topbar hero-surface">
        <div>
          <p className="eyebrow">Configurações institucionais</p>
          <h1 className="page-title">Configurações da Escola LaBC de Inovação</h1>
          <p className="page-copy">
            Centralize parâmetros institucionais da plataforma. Nesta versão
            demonstrativa, os itens abaixo orientam a evolução para telas de
            configuração persistentes.
          </p>
        </div>
      </section>

      <section className="persona-action-grid" aria-label="Configurações">
        {settings.map((item) => (
          <article className="list-card" key={item.title}>
            <span className="action-icon" aria-hidden="true">
              CF
            </span>
            <strong>{item.title}</strong>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Status da funcionalidade</h2>
        <p className="muted-small">
          A rota já está protegida por RBAC com a permissão
          <strong> settings.manage</strong>. A persistência das configurações
          deve ser ligada a uma tabela própria quando a plataforma sair do modo
          MVP demonstrativo.
        </p>
      </section>
    </AppShell>
  );
}
