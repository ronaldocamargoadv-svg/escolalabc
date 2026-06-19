"use client";

import { useActionState } from "react";
import { LATTES_EXAMPLE_URL } from "@/lib/lattes";
import { updateUserLattesAction, type UpdateUserLattesState } from "./actions";

const initialState: UpdateUserLattesState = {};

export function UserLattesForm({
  userId,
  currentUrl
}: {
  userId: string;
  currentUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateUserLattesAction,
    initialState
  );

  return (
    <form action={formAction} className="form-grid compact">
      <input name="usuarioId" type="hidden" value={userId} />
      <div className="field">
        <label htmlFor={`lattes-${userId}`}>Link do Currículo Lattes</label>
        <input
          defaultValue={currentUrl ?? ""}
          id={`lattes-${userId}`}
          maxLength={200}
          name="lattesUrl"
          placeholder={LATTES_EXAMPLE_URL}
          type="url"
        />
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
