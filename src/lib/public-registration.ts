import bcrypt from "bcryptjs";
import { ROLES } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  createEnrollmentWithinTransaction,
  EnrollmentError
} from "@/lib/enrollments";

export type PublicRegistrationClass = {
  id: string;
  curso: string;
  turma: string;
  descricao: string | null;
  modalidade: string;
  dataInicio: string;
  vagas: number;
  inscritos: number;
  vagasDisponiveis: number;
};

export type PublicRegistrationInput = {
  turmaId: string;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
};

export class PublicRegistrationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "PublicRegistrationError";
    this.code = code;
    this.status = status;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}

export async function getPublicRegistrationClass(
  turmaId: string
): Promise<PublicRegistrationClass | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      turmaId
    )
  ) {
    return null;
  }

  const db = getDb();
  const result = await db.query(
    `
      SELECT
        t.id,
        c.nome AS curso,
        t.nome AS turma,
        c.descricao,
        t.modalidade,
        to_char(t.data_inicio, 'DD/MM/YYYY') AS data_inicio,
        t.vagas,
        COUNT(i.id)::int AS inscritos
      FROM turmas t
      INNER JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN inscricoes i ON i.turma_id = t.id AND i.status <> 'cancelado'
      WHERE t.id = $1
        AND t.status = 'publicada'
        AND c.status = 'publicado'
      GROUP BY t.id, c.id
      LIMIT 1
    `,
    [turmaId]
  );
  const item = result.rows[0];

  if (!item) {
    return null;
  }

  const vagas = Number(item.vagas);
  const inscritos = Number(item.inscritos);

  return {
    id: item.id,
    curso: item.curso,
    turma: item.turma,
    descricao: item.descricao,
    modalidade: item.modalidade,
    dataInicio: item.data_inicio,
    vagas,
    inscritos,
    vagasDisponiveis: Math.max(vagas - inscritos, 0)
  };
}

export async function registerParticipantForClass(
  input: PublicRegistrationInput
) {
  const db = getDb();
  const client = await db.connect();
  const email = normalizeEmail(input.email);
  const cpf = normalizeCpf(input.cpf);

  try {
    await client.query("BEGIN");

    if (cpf.length !== 11) {
      throw new PublicRegistrationError(
        "INVALID_CPF",
        "CPF deve conter 11 dígitos.",
        422
      );
    }

    const classInfo = await getPublicRegistrationClass(input.turmaId);

    if (!classInfo) {
      throw new PublicRegistrationError(
        "CLASS_UNAVAILABLE",
        "Turma não disponível para inscrição pública.",
        404
      );
    }

    if (classInfo.vagasDisponiveis <= 0) {
      throw new PublicRegistrationError(
        "CLASS_FULL",
        "Turma sem vagas disponíveis.",
        409
      );
    }

    const existingUser = await client.query(
      `
        SELECT id
        FROM usuarios
        WHERE lower(email) = $1
          OR regexp_replace(cpf, '\\D', '', 'g') = $2
        LIMIT 1
      `,
      [email, cpf]
    );

    if (existingUser.rows[0]) {
      throw new PublicRegistrationError(
        "USER_ALREADY_EXISTS",
        "Não foi possível concluir o cadastro por link. Se já possuir conta, entre na plataforma e realize a inscrição pelo catálogo.",
        409
      );
    }

    const profileResult = await client.query(
      "SELECT id FROM perfis WHERE nome = $1",
      [ROLES.participante]
    );
    const profile = profileResult.rows[0] as { id: string } | undefined;

    if (!profile) {
      throw new PublicRegistrationError(
        "PROFILE_NOT_FOUND",
        "Perfil de aluno não encontrado.",
        500
      );
    }

    const passwordHash = await bcrypt.hash(input.senha, 10);
    const userResult = await client.query(
      `
        INSERT INTO usuarios (
          id, nome, cpf, email, senha_hash, vinculo, status, atualizado_em
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'servidor', 'ativo', now())
        RETURNING id, nome, email
      `,
      [input.nome.trim(), cpf, email, passwordHash]
    );
    const user = userResult.rows[0] as {
      id: string;
      nome: string;
      email: string;
    };

    await client.query(
      "INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES ($1, $2)",
      [user.id, profile.id]
    );

    await createEnrollmentWithinTransaction(client, {
      usuarioId: user.id,
      turmaId: input.turmaId,
      origem: "link_publico"
    });

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof EnrollmentError) {
      throw new PublicRegistrationError(error.code, error.message, error.status);
    }

    throw error;
  } finally {
    client.release();
  }
}
