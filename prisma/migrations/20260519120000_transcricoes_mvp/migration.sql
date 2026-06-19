CREATE TABLE "transcricao_reunioes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "titulo" text NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'pendente',
  "nome_arquivo_original" text NOT NULL,
  "mime_type" varchar(120) NOT NULL,
  "caminho_audio" text NOT NULL,
  "tamanho_bytes" integer NOT NULL,
  "texto_bruto" text,
  "texto_revisado" text,
  "texto_final" text,
  "criado_por" uuid REFERENCES "usuarios"("id"),
  "criado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "transcricao_trechos" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reuniao_id" uuid NOT NULL REFERENCES "transcricao_reunioes"("id") ON DELETE CASCADE,
  "ordem" integer NOT NULL,
  "falante_chave" varchar(40) NOT NULL,
  "falante_nome" text,
  "inicio_segundos" integer NOT NULL,
  "fim_segundos" integer NOT NULL,
  "assunto" text,
  "texto_bruto" text NOT NULL,
  "texto_revisado" text,
  "criado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "transcricao_glossario" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "termo" text NOT NULL UNIQUE,
  "categoria" varchar(40) NOT NULL,
  "forma_preferida" text NOT NULL,
  "observacao" text,
  "criado_por" uuid REFERENCES "usuarios"("id"),
  "criado_em" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "transcricao_trechos_reuniao_id_ordem_idx"
  ON "transcricao_trechos"("reuniao_id", "ordem");

CREATE INDEX "transcricao_trechos_reuniao_id_falante_chave_idx"
  ON "transcricao_trechos"("reuniao_id", "falante_chave");
