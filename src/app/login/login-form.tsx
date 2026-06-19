"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

const demoProfiles = [
  {
    label: "Administrador",
    email: "admin@labc.local",
    senha: "admin123"
  },
  {
    label: "Instrutor",
    email: "instrutor@labc.local",
    senha: "instrutor123"
  },
  {
    label: "Aluno",
    email: "aluno@labc.local",
    senha: "aluno123"
  }
];

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  return (
    <div className="login-flow">
      <div className="demo-switcher" aria-label="Perfis de demonstração">
        {demoProfiles.map((profile) => (
          <button
            aria-pressed={selectedProfile === profile.email}
            className={
              selectedProfile === profile.email
                ? "demo-profile-button active"
                : "demo-profile-button"
            }
            key={profile.email}
            onClick={() => {
              setEmail(profile.email);
              setSenha(profile.senha);
              setSelectedProfile(profile.email);
            }}
            type="button"
          >
            <span>{profile.label}</span>
            <small>{profile.email}</small>
          </button>
        ))}
      </div>

      <form className="form-grid" action={formAction}>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input
            autoComplete="email"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </div>
        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            autoComplete="current-password"
            id="senha"
            name="senha"
            onChange={(event) => setSenha(event.target.value)}
            type="password"
            value={senha}
          />
        </div>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Entrando..." : "Entrar na plataforma"}
        </button>
      </form>
    </div>
  );
}
