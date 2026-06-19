"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type ChangePasswordState
} from "./actions";

const initialState: ChangePasswordState = {};

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState
  );

  return (
    <form className="form-grid" action={formAction}>
      <div className="field">
        <label htmlFor="senhaAtual">Senha atual</label>
        <input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
        />
      </div>
      <div className="field">
        <label htmlFor="novaSenha">Nova senha</label>
        <input
          id="novaSenha"
          name="novaSenha"
          type="password"
          autoComplete="new-password"
        />
      </div>
      <div className="field">
        <label htmlFor="confirmarSenha">Confirmar nova senha</label>
        <input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
        />
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Atualizando..." : "Alterar senha"}
      </button>
    </form>
  );
}
