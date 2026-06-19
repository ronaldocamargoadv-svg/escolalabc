"use client";

import { useActionState } from "react";
import {
  publicRegistrationAction,
  type PublicRegistrationState
} from "./actions";

const initialState: PublicRegistrationState = {};

export function PublicRegistrationForm({ turmaId }: { turmaId: string }) {
  const [state, formAction, pending] = useActionState(
    publicRegistrationAction,
    initialState
  );

  return (
    <form className="form-grid" action={formAction}>
      <input name="turmaId" type="hidden" value={turmaId} />
      <div className="field">
        <label htmlFor="nome">Nome completo</label>
        <input
          id="nome"
          maxLength={120}
          name="nome"
          placeholder="Nome do aluno"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="cpf">CPF</label>
        <input
          autoComplete="off"
          id="cpf"
          inputMode="numeric"
          maxLength={20}
          name="cpf"
          placeholder="000.000.000-00"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="aluno@dominio.gov.br"
          required
          type="email"
        />
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            autoComplete="new-password"
            id="senha"
            minLength={8}
            maxLength={128}
            name="senha"
            required
            type="password"
          />
        </div>
        <div className="field">
          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <input
            autoComplete="new-password"
            id="confirmarSenha"
            minLength={8}
            maxLength={128}
            name="confirmarSenha"
            required
            type="password"
          />
        </div>
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Enviando..." : "Cadastrar e inscrever-se"}
      </button>
    </form>
  );
}
