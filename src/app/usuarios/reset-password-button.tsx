"use client";

import { useActionState } from "react";
import {
  resetUserPasswordAction,
  type ResetUserPasswordState
} from "./actions";

const initialState: ResetUserPasswordState = {};

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    resetUserPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="inline-password-reset">
      <input name="usuarioId" type="hidden" value={userId} />
      <button className="text-button" disabled={pending} type="submit">
        {pending ? "Gerando..." : "Redefinir senha"}
      </button>
      {state.error ? <span className="form-error">{state.error}</span> : null}
      {state.temporaryPassword ? (
        <span className="temporary-password">
          Senha temporária: <code>{state.temporaryPassword}</code>
        </span>
      ) : null}
    </form>
  );
}
