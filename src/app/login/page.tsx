import { LoginForm } from "./login-form";
import { BrandLogo } from "@/components/brand-signature";

export default function LoginPage() {
  return (
    <main className="public-shell">
      <section className="login-panel">
        <div className="login-brand">
          <BrandLogo
            className="login-logo"
            priority
            sizes="(max-width: 680px) 142px, (max-width: 1080px) 188px, 220px"
          />
          <p className="eyebrow">Formação e inovação pública</p>
          <h1 className="page-title">Do conhecimento à ação.</h1>
          <p className="page-copy">
            Aprendizagem para transformar serviços públicos, conectar pessoas
            e desenvolver soluções para uma cidade inteligente.
          </p>
          <div className="login-highlights" aria-label="Destaques da plataforma">
            <span>Aprender para transformar</span>
            <span>Conectar para inovar</span>
            <span>Colaborar para evoluir</span>
            <span>Impactar para servir</span>
          </div>
        </div>

        <div className="login-card">
          <p className="eyebrow">Entrar</p>
          <h2>Escolha um perfil de demonstração ou use suas credenciais</h2>
          <LoginForm />
          <div className="demo-credentials">
            <h2>Credenciais para demonstração</h2>
          <p>
            Use apenas para validar os fluxos do MVP local. Os dados abaixo são
            fictícios e fazem parte da massa de testes.
          </p>
          <dl>
            <div>
              <dt>Administrador</dt>
              <dd>admin@labc.local / admin123</dd>
            </div>
            <div>
              <dt>Instrutor</dt>
              <dd>instrutor@labc.local / instrutor123</dd>
            </div>
            <div>
              <dt>Aluno</dt>
              <dd>aluno@labc.local / aluno123</dd>
            </div>
          </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
