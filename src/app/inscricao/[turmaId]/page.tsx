import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicRegistrationClass } from "@/lib/public-registration";
import { PublicRegistrationForm } from "./registration-form";
import { uiLabel } from "@/lib/ui-labels";
import { PublicBrand } from "@/components/brand-signature";

type PageProps = {
  params: Promise<{
    turmaId: string;
  }>;
};

export default async function PublicRegistrationPage({ params }: PageProps) {
  const { turmaId } = await params;
  const turma = await getPublicRegistrationClass(turmaId);

  if (!turma) {
    notFound();
  }

  return (
    <main className="public-shell">
      <section className="panel public-panel">
        <PublicBrand compact />
        <p className="eyebrow">Inscrição pública LaBC</p>
        <h1 className="page-title">{turma.curso}</h1>
        <p className="page-copy">
          Preencha seus dados para criar uma conta de aluno e confirmar
          sua inscrição nesta oferta formativa do LaBC.
        </p>
        <p className="muted-small">
          Já possui cadastro?{" "}
          <Link href="/login" className="text-button">
            Entre na plataforma
          </Link>{" "}
          e realize a inscrição pelo catálogo.
        </p>

        <dl className="definition-grid lower-grid">
          <div>
            <dt>Turma</dt>
            <dd>{turma.turma}</dd>
          </div>
          <div>
            <dt>Modalidade</dt>
            <dd>{uiLabel(turma.modalidade)}</dd>
          </div>
          <div>
            <dt>Início</dt>
            <dd>{turma.dataInicio}</dd>
          </div>
          <div>
            <dt>Vagas</dt>
            <dd>
              {turma.vagasDisponiveis} disponíveis de {turma.vagas}
            </dd>
          </div>
        </dl>

        {turma.descricao ? <p className="page-copy">{turma.descricao}</p> : null}

        <div style={{ marginTop: 24 }}>
          {turma.vagasDisponiveis > 0 ? (
            <PublicRegistrationForm turmaId={turma.id} />
          ) : (
            <p className="form-error">
              Esta turma não possui vagas disponíveis no momento.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
