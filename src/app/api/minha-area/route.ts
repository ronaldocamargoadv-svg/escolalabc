import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import {
  getMyCertificates,
  getMyEnrollments,
  getMyMaterials,
  getMyMeetings
} from "@/lib/my-area";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  const [inscricoes, materiais, certificados, encontros] = await Promise.all([
    getMyEnrollments(auth.user.id),
    getMyMaterials(auth.user.id),
    getMyCertificates(auth.user.id),
    getMyMeetings(auth.user.id)
  ]);

  return NextResponse.json({
    data: {
      inscricoes,
      materiais,
      certificados,
      encontros
    }
  });
}
