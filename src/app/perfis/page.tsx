import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import {
  hasPermission,
  listProfilesWithPermissions,
  permissionCatalog
} from "@/lib/permissions";
import {
  createProfileAction,
  deleteProfileAction,
  updateProfilePermissionsAction
} from "./actions";
import { uiLabel } from "@/lib/ui-labels";

export default async function ProfilesPage() {
  const user = await requirePermission("roles.view");
  const profiles = await listProfilesWithPermissions();
  const canCreateProfile = hasPermission(user, "roles.create");
  const canDeleteProfile = hasPermission(user, "roles.delete");
  const canManagePermissions = hasPermission(user, "permissions.manage");
  const groupedPermissions = permissionCatalog.reduce(
    (groups, item) => {
      const category = item[2];
      groups[category] = [...(groups[category] ?? []), item];
      return groups;
    },
    {} as Record<string, typeof permissionCatalog[number][]>
  );

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">RBAC</p>
          <h1 className="page-title">Perfis e permissões</h1>
          <p className="page-copy">
            Crie perfis personalizados e defina exatamente quais funcionalidades
            cada grupo pode acessar na plataforma.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Matriz de permissões</h2>
          <div className="stack-list">
            {profiles.map((profile) => (
              <article className="list-card" key={profile.id}>
                <div className="section-heading">
                  <div>
                    <h3>{uiLabel(profile.nome)}</h3>
                    <p className="muted-small">
                      {profile.descricao || "Perfil personalizado"}
                    </p>
                  </div>
                  <span className={profile.sistema ? "badge" : "badge blue"}>
                    {profile.sistema ? "sistema" : "personalizado"}
                  </span>
                </div>

                <form className="permission-grid" action={updateProfilePermissionsAction}>
                  <input name="perfilId" type="hidden" value={profile.id} />
                  {Object.entries(groupedPermissions).map(
                    ([category, permissions]) => (
                      <fieldset className="permission-group" key={category}>
                        <legend>{category}</legend>
                        {permissions.map(([code, description]) => (
                          <label className="check-row" key={code}>
                            <input
                              name="permissoes"
                              type="checkbox"
                              value={code}
                              defaultChecked={profile.permissoes.includes(code)}
                              disabled={!canManagePermissions}
                            />
                            <span>
                              <strong>{code}</strong>
                              <small>{description}</small>
                            </span>
                          </label>
                        ))}
                      </fieldset>
                    )
                  )}
                  <div className="action-row compact">
                    {canManagePermissions ? (
                      <button className="button" type="submit">
                        Salvar permissões
                      </button>
                    ) : null}
                    {canDeleteProfile && !profile.sistema ? (
                      <button
                        className="text-button danger"
                        formAction={deleteProfileAction}
                        type="submit"
                      >
                        Excluir perfil
                      </button>
                    ) : null}
                  </div>
                </form>
              </article>
            ))}
          </div>
        </div>

        {canCreateProfile ? (
        <aside className="panel">
          <h2>Novo perfil personalizado</h2>
          <form className="form-grid" action={createProfileAction}>
            <div className="field">
              <label htmlFor="nome">Nome do perfil</label>
              <input
                id="nome"
                maxLength={80}
                name="nome"
                placeholder="Coordenador de Curso"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                maxLength={240}
                name="descricao"
                placeholder="Responsabilidades principais do perfil"
              />
            </div>
            <div className="permission-grid compact-permissions">
              {Object.entries(groupedPermissions).map(
                ([category, permissions]) => (
                  <fieldset className="permission-group" key={category}>
                    <legend>{category}</legend>
                    {permissions.map(([code, description]) => (
                      <label className="check-row" key={code}>
                        <input name="permissoes" type="checkbox" value={code} />
                        <span>
                          <strong>{code}</strong>
                          <small>{description}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )
              )}
            </div>
            <button className="button" type="submit">
              Criar perfil
            </button>
          </form>
        </aside>
        ) : null}
      </section>
    </AppShell>
  );
}
