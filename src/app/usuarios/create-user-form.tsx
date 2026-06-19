"use client";

import { useActionState } from "react";
import type { ClassSummary } from "@/lib/classes";
import type { ProfilePermissionSummary } from "@/lib/permissions";
import { uiLabel } from "@/lib/ui-labels";
import { createUserAction, type CreateUserState } from "./actions";

type CreateUserFormProps = {
  classes: ClassSummary[];
  profiles: ProfilePermissionSummary[];
};

const initialState: CreateUserState = {};

export function CreateUserForm({ classes, profiles }: CreateUserFormProps) {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <aside className="panel">
      <h2>Novo usuário</h2>
      <form className="form-grid" action={formAction}>
        <div className="field">
          <label htmlFor="nome">Nome</label>
          <input id="nome" name="nome" placeholder="Nome completo" required />
        </div>
        <div className="field">
          <label htmlFor="cpf">CPF</label>
          <input id="cpf" name="cpf" placeholder="000.000.000-00" required />
        </div>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" placeholder="usuario@municipio.gov.br" required type="email" />
        </div>
        <div className="field">
          <label htmlFor="perfil">Perfil</label>
          <select id="perfil" name="perfil" defaultValue="participante">
            {profiles
              .filter((profile) => profile.nome !== "administrador_geral")
              .map((profile) => (
                <option key={profile.id} value={profile.nome}>
                  {uiLabel(profile.nome)}
                </option>
              ))}
          </select>
        </div>
        <p className="muted-small">
          Novos administradores devem utilizar um link administrativo em{" "}
          <a className="text-button" href="/convites">
            Links de Cadastro
          </a>
          .
        </p>
        <div className="field">
          <label htmlFor="turmaId">Turma para Instrutor</label>
          <select id="turmaId" name="turmaId" defaultValue="">
            <option value="">Selecione ao cadastrar um Instrutor</option>
            {classes
              .filter((item) => !["encerrada", "cancelada"].includes(item.status))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.cursoNome} - {item.nome}
                </option>
              ))}
          </select>
          <p className="muted-small">
            Para cadastrar um Instrutor, selecione a turma correspondente. O
            acesso ficará limitado a esse vínculo.
          </p>
        </div>
        <button className="button" disabled={pending} type="submit">
          {pending ? "Criando..." : "Criar usuário"}
        </button>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.success ? <p className="form-success">{state.success}</p> : null}
        {state.temporaryCredentials ? (
          <div className="credential-notice">
            <strong>Credencial temporária</strong>
            <p>{state.temporaryCredentials.email}</p>
            <code>{state.temporaryCredentials.password}</code>
            <p className="muted-small">
              Esta senha é exibida somente após a criação. Oriente a alteração
              no primeiro acesso.
            </p>
          </div>
        ) : null}
      </form>
    </aside>
  );
}
