import { ValidationForm } from "./validation-form";
import { PublicBrand } from "@/components/brand-signature";

export default function CertificateValidationPage() {
  return (
    <main className="public-shell">
      <section className="panel public-panel">
        <PublicBrand compact />
        <p className="eyebrow">Validação pública</p>
        <h1 className="page-title">Consultar certificado</h1>
        <p className="page-copy">
          Informe o código de validação impresso no certificado da Escola LaBC de Inovação
          ou acesse esta página pelo QR Code do documento.
        </p>

        <ValidationForm />
      </section>
    </main>
  );
}
