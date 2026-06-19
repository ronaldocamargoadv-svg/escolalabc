"use client";

import { useActionState } from "react";
import {
  invitationRegistrationAction,
  type InviteRegistrationState
} from "./actions";
import { LATTES_EXAMPLE_URL } from "@/lib/lattes";

const initialState: InviteRegistrationState = {};

export function InviteRegistrationForm({
  token,
  restrictedEmail,
  isInstructor
}: {
  token: string;
  restrictedEmail?: string | null;
  isInstructor: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    invitationRegistrationAction,
    initialState
  );

  return (
    <form action={formAction} className="form-grid invite-registration-form">
      <input name="token" type="hidden" value={token} />
      <div className="field">
        <label htmlFor="nome">Nome completo</label>
        <input id="nome" maxLength={120} name="nome" required />
      </div>
      <div className="split">
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
          <label htmlFor="telefone">Telefone (opcional)</label>
          <input id="telefone" maxLength={30} name="telefone" type="tel" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input
          autoComplete="email"
          defaultValue={restrictedEmail ?? ""}
          id="email"
          name="email"
          readOnly={Boolean(restrictedEmail)}
          required
          type="email"
        />
      </div>
      <div className="field">
        <label htmlFor="lattesUrl">Link do Currículo Lattes (opcional)</label>
        <input
          id="lattesUrl"
          inputMode="url"
          maxLength={200}
          name="lattesUrl"
          placeholder={LATTES_EXAMPLE_URL}
          type="url"
        />
        <p className="muted-small">
          {isInstructor
            ? "Para instrutores, o Currículo Lattes ajuda a apresentar a trajetória acadêmica e profissional."
            : "Informe o link público do seu Currículo Lattes, se possuir."}
        </p>
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="orgaoSecretaria">Órgão/Secretaria (opcional)</label>
          <input id="orgaoSecretaria" maxLength={160} name="orgaoSecretaria" />
        </div>
        <div className="field">
          <label htmlFor="cargo">Cargo/Função (opcional)</label>
          <input id="cargo" maxLength={120} name="cargo" />
        </div>
      </div>
      <div className="split">
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            autoComplete="new-password"
            id="senha"
            maxLength={128}
            minLength={8}
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
            maxLength={128}
            minLength={8}
            name="confirmarSenha"
            required
            type="password"
          />
        </div>
      </div>
      <p className="muted-small">
        Sua senha deve ter ao menos 8 caracteres, uma letra e um número.
      </p>
      <label className="invite-risk-check">
        <input name="aceitarTermos" required type="checkbox" />
        <span>
          Confirmo que os dados informados são destinados ao acesso à Escola
          LaBC de Inovação e serão tratados conforme as finalidades da plataforma.
        </span>
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Criando conta..." : "Criar minha conta"}
      </button>
    </form>
  );
}
