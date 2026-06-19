"use client";

import { useActionState } from "react";
import { LATTES_EXAMPLE_URL } from "@/lib/lattes";
import { updateLattesAction, type UpdateLattesState } from "./actions";

const initialState: UpdateLattesState = {};

export function LattesForm({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction, pending] = useActionState(
    updateLattesAction,
    initialState
  );

  return (
    <form action={formAction} className="form-grid">
      <div className="field">
        <label htmlFor="lattesUrl">Link do Currículo Lattes</label>
        <input
          defaultValue={currentUrl ?? ""}
          id="lattesUrl"
          inputMode="url"
          maxLength={200}
          name="lattesUrl"
          placeholder={LATTES_EXAMPLE_URL}
          type="url"
        />
        <p className="muted-small">
          Informe o link público do seu Currículo Lattes, se possuir.
        </p>
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <div className="action-row compact">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
        {currentUrl ? (
          <a
            className="button secondary"
            href={currentUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Abrir Currículo Lattes
          </a>
        ) : null}
      </div>
    </form>
  );
}
