import { AppShell, UserPill } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { getProfessionalProfile } from "@/lib/profile";
import { uiLabel } from "@/lib/ui-labels";
import { LattesForm } from "./lattes-form";
import { PasswordForm } from "./password-form";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const professionalProfile = await getProfessionalProfile(user.id);

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Conta</p>
          <h1 className="page-title">Meu perfil</h1>
          <p className="page-copy">
            Consulte seus dados, registre sua trajetória profissional e altere
            sua senha de acesso.
          </p>
        </div>
        <UserPill user={user} />
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Dados da conta</h2>
          <dl className="definition-grid">
            <div>
              <dt>Nome</dt>
              <dd>{user.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Perfis</dt>
              <dd>{user.perfis.map((perfil) => uiLabel(perfil)).join(", ")}</dd>
            </div>
          </dl>

          <h2 style={{ marginTop: 24 }}>Dados acadêmicos e profissionais</h2>
          <dl className="definition-grid" style={{ marginBottom: 18 }}>
            <div>
              <dt>Instituição/Secretaria</dt>
              <dd>{professionalProfile.orgaoSecretaria ?? "Não informado"}</dd>
            </div>
            <div>
              <dt>Cargo/Função</dt>
              <dd>{professionalProfile.cargo ?? "Não informado"}</dd>
            </div>
          </dl>
          <LattesForm currentUrl={professionalProfile.lattesUrl} />
        </div>

        <aside className="panel">
          <h2>Alterar senha</h2>
          <PasswordForm />
        </aside>
      </section>
    </AppShell>
  );
}
