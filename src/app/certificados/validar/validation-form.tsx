"use client";

import { useActionState } from "react";
import {
  validateCertificateAction,
  type ValidationState
} from "./actions";

const initialState: ValidationState = {};

export function ValidationForm() {
  const [state, formAction, pending] = useActionState(
    validateCertificateAction,
    initialState
  );
  const certificateStatusLabel = (status: string) =>
    status === "valido" ? "Válido" : status === "cancelado" ? "Cancelado" : status;

  return (
    <>
      <form className="form-grid" style={{ marginTop: 24 }} action={formAction}>
        <div className="field">
          <label htmlFor="codigo">Código de validação</label>
          <input
            id="codigo"
            name="codigo"
            placeholder="LABC-2026-000001"
            autoComplete="off"
          />
        </div>
        {state.error ? <p className="form-error">{state.error}</p> : null}
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Validando..." : "Validar autenticidade"}
        </button>
      </form>

      {state.certificate ? (
        <div className="panel" style={{ marginTop: 20, boxShadow: "none" }}>
          <h2>Resultado da validação</h2>
          <table className="table">
            <tbody>
              <tr>
                <th>Status</th>
                <td>
                  <span
                    className={
                      state.certificate.status === "valido"
                        ? "badge"
                        : "badge warning"
                    }
                  >
                    {certificateStatusLabel(state.certificate.status)}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Aluno</th>
                <td>{state.certificate.participante}</td>
              </tr>
              <tr>
                <th>Curso</th>
                <td>{state.certificate.curso}</td>
              </tr>
              <tr>
                <th>Carga horária</th>
                <td>{state.certificate.cargaHoraria}h</td>
              </tr>
              <tr>
                <th>Emissão</th>
                <td>{state.certificate.dataEmissao}</td>
              </tr>
              {state.certificate.status === "cancelado" ? (
                <>
                  <tr>
                    <th>Cancelamento</th>
                    <td>{state.certificate.dataCancelamento}</td>
                  </tr>
                  <tr>
                    <th>Motivo</th>
                    <td>{state.certificate.motivoCancelamento}</td>
                  </tr>
                </>
              ) : null}
              <tr>
                <th>Código</th>
                <td>{state.certificate.codigoValidacao}</td>
              </tr>
              <tr>
                <th>Emissor</th>
                <td>{state.certificate.emissor}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
