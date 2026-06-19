import { issueCertificate } from "@/lib/certificates";
import { getDb } from "@/lib/db";
import { refreshEnrollmentCertificationEligibility } from "@/lib/evaluations";

export async function maybeAutoIssueCertificate(inscricaoId: string) {
  const eligibility = await refreshEnrollmentCertificationEligibility(inscricaoId);

  if (
    !eligibility.eligible ||
    !eligibility.autoIssueCertificate ||
    eligibility.manualAdminRelease
  ) {
    return null;
  }

  const db = getDb();
  const existing = await db.query(
    `
      SELECT id
      FROM certificados
      WHERE inscricao_id = $1
        AND status = 'valido'
      LIMIT 1
    `,
    [inscricaoId]
  );

  if (existing.rows[0]) {
    return null;
  }

  return issueCertificate(inscricaoId);
}
