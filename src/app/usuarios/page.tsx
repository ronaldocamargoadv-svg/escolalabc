import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth";
import { hasPermission, listProfilesWithPermissions } from "@/lib/permissions";
import { listUsers } from "@/lib/users";
import { listClasses } from "@/lib/classes";
import { uiLabel } from "@/lib/ui-labels";
import { UserLattesForm } from "./lattes-form";
import { CreateUserForm } from "./create-user-form";
import { ResetPasswordButton } from "./reset-password-button";
import {
  setUserProfilesAction,
  updateUserStatusAction
} from "./actions";

export default async function UsersPage() {
  const user = await requirePermission("users.view");
  const canCreateUser = hasPermission(user, "users.create");
  const canEditUser = hasPermission(user, "users.edit");
  const [users, profiles, classes] = await Promise.all([
    listUsers(),
    canCreateUser || canEditUser
      ? listProfilesWithPermissions()
      : Promise.resolve([]),
    canCreateUser ? listClasses(user) : Promise.resolve([])
  ]);

  return (
    <AppShell user={user}>
      <section className="topbar">
        <div>
          <p className="eyebrow">Acesso e permissões</p>
          <h1 className="page-title">Usuários</h1>
          <p className="page-copy">
            Gerencie usuários, atribua perfis de acesso e acompanhe bloqueios
            com rastreabilidade administrativa.
          </p>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <h2>Usuários cadastrados</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Lattes</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td>{item.email}</td>
                  <td>
                    <span className="badge blue">
                      {item.perfis.map((perfil) => uiLabel(perfil)).join(", ")}
                    </span>
                    {canEditUser ? (
                      <form
                        className="form-grid compact-user-profiles"
                        action={setUserProfilesAction}
                      >
                        <input name="usuarioId" type="hidden" value={item.id} />
                        {profiles
                          .filter(
                            (profile) =>
                              profile.nome !== "administrador_geral" ||
                              item.perfis.includes("administrador_geral")
                          )
                          .map((profile) => (
                          <label className="check-row" key={profile.id}>
                            <input
                              name="perfilIds"
                              type="checkbox"
                              value={profile.id}
                              defaultChecked={item.perfis.includes(profile.nome)}
                            />
                            <span>
                              <strong>{uiLabel(profile.nome)}</strong>
                            </span>
                          </label>
                          ))}
                        <button className="text-button" type="submit">
                          Salvar perfis
                        </button>
                      </form>
                    ) : null}
                  </td>
                  <td>
                    {item.lattesUrl ? (
                      <a
                        className="text-button"
                        href={item.lattesUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Ver Lattes
                      </a>
                    ) : (
                      <span className="muted-small">Não informado</span>
                    )}
                    {canEditUser ? (
                      <details className="row-editor">
                        <summary className="text-button">Editar Lattes</summary>
                        <UserLattesForm
                          currentUrl={item.lattesUrl}
                          userId={item.id}
                        />
                      </details>
                    ) : null}
                  </td>
                  <td>{uiLabel(item.status)}</td>
                  <td>
                    <div className="inline-actions">
                      {!canEditUser ? (
                        <span className="muted-small">Somente leitura</span>
                      ) : item.id === user.id ? (
                        <span className="muted-small">Conta atual</span>
                      ) : item.status === "ativo" ? (
                        <form action={updateUserStatusAction}>
                          <input name="usuarioId" type="hidden" value={item.id} />
                          <input name="status" type="hidden" value="inativo" />
                          <button className="text-button danger" type="submit">
                            Inativar
                          </button>
                        </form>
                      ) : (
                        <form action={updateUserStatusAction}>
                          <input name="usuarioId" type="hidden" value={item.id} />
                          <input name="status" type="hidden" value="ativo" />
                          <button className="text-button" type="submit">
                            Ativar
                          </button>
                        </form>
                      )}
                      {canEditUser ? (
                        <ResetPasswordButton userId={item.id} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {canCreateUser ? <CreateUserForm classes={classes} profiles={profiles} /> : null}
      </section>
    </AppShell>
  );
}
