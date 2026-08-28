-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "organizadores" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "chave_pix" TEXT,
    "tipo_chave_pix" TEXT,
    "logo_url" TEXT,
    "instagram" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL,
    "organizador_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "sigla" VARCHAR(4) NOT NULL,
    "nome" TEXT NOT NULL,
    "subtitulo" TEXT,
    "descricao" TEXT,
    "percurso" TEXT,
    "kit" TEXT,
    "horario_largada" TEXT,
    "retirada_kit" TEXT,
    "data_evento" TIMESTAMPTZ(6) NOT NULL,
    "local_nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "endereco" TEXT,
    "imagem_capa_url" TEXT,
    "regulamento_url" TEXT,
    "inscricoes_abrem_em" TIMESTAMPTZ(6),
    "inscricoes_fecham_em" TIMESTAMPTZ(6),
    "limite_vagas" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "aceita_pix" BOOLEAN NOT NULL DEFAULT true,
    "aceita_dinheiro" BOOLEAN NOT NULL DEFAULT false,
    "proximo_numero" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalidades" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "distancia_km" DECIMAL(6,2),
    "idade_minima" INTEGER NOT NULL DEFAULT 0,
    "limite_vagas" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "modalidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "inicio_em" TIMESTAMPTZ(6),
    "fim_em" TIMESTAMPTZ(6),
    "limite_vagas" INTEGER,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "modalidade_id" UUID NOT NULL,
    "lote_id" UUID NOT NULL,
    "numero_inscricao" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "idade" INTEGER NOT NULL,
    "sexo" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "tamanho_camisa" TEXT NOT NULL,
    "modelo_camisa" TEXT,
    "equipe" TEXT,
    "contato_emergencia_nome" TEXT NOT NULL,
    "contato_emergencia_telefone" TEXT NOT NULL,
    "responsavel_nome" TEXT,
    "responsavel_cpf" TEXT,
    "forma_pagamento" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "aceite_regulamento" BOOLEAN NOT NULL,
    "aceite_lgpd" BOOLEAN NOT NULL,
    "aceite_em" TIMESTAMPTZ(6),
    "ip_aceite" TEXT,
    "observacoes_admin" TEXT,
    "confirmada_em" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizadores_email_key" ON "organizadores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE INDEX "eventos_status_idx" ON "eventos"("status");

-- CreateIndex
CREATE INDEX "eventos_data_evento_idx" ON "eventos"("data_evento");

-- CreateIndex
CREATE INDEX "modalidades_evento_id_idx" ON "modalidades"("evento_id");

-- CreateIndex
CREATE INDEX "lotes_evento_id_idx" ON "lotes"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_numero_inscricao_key" ON "inscricoes"("numero_inscricao");

-- CreateIndex
CREATE INDEX "inscricoes_telefone_idx" ON "inscricoes"("telefone");

-- CreateIndex
CREATE INDEX "inscricoes_evento_id_status_idx" ON "inscricoes"("evento_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_evento_id_cpf_key" ON "inscricoes"("evento_id", "cpf");

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_organizador_id_fkey" FOREIGN KEY ("organizador_id") REFERENCES "organizadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalidades" ADD CONSTRAINT "modalidades_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_modalidade_id_fkey" FOREIGN KEY ("modalidade_id") REFERENCES "modalidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

