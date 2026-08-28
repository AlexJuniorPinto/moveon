# MoveON

Plataforma de inscrição em corridas de rua: vitrine de provas, formulário de inscrição, banco de dados e finalização no WhatsApp.

Fase 1 — pagamento manual. O participante preenche o formulário, a inscrição é gravada como `pendente` e ele é levado ao WhatsApp do organizador, que envia o Pix e confirma a vaga no painel.

---

## Stack

| Camada | Escolha |
|---|---|
| Front-end | Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 |
| Back-end | Route Handlers e Server Actions do próprio Next.js |
| Banco | PostgreSQL (Supabase) via Prisma |
| Autenticação do painel | Sessão própria em cookie assinado (HMAC) + senha com `scrypt` |
| Deploy | Vercel ou Docker Compose no VPS |

Sem dependência paga. O bundle da home fecha em **113 kB** de JavaScript no primeiro carregamento: a vitrine e o formulário são os únicos componentes de cliente, e o painel inteiro roda com `<form>` e Server Actions.

---

## Subir o projeto

### 1. Instalar

```bash
npm install
```

### 2. Criar o banco no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (plano gratuito serve).
2. Vá em **Project Settings → Database → Connection string**.
3. Copie duas strings:
   - **Transaction pooler** (porta `6543`) → `DATABASE_URL`
   - **Session/Direct** (porta `5432`) → `DIRECT_URL`

### 3. Configurar o `.env`

```bash
cp .env.example .env
npm run gerar-segredo   # copie a saída para SESSAO_SEGREDO
```

Preencha `DATABASE_URL`, `DIRECT_URL`, `SESSAO_SEGREDO` e os dados do organizador
(`ORGANIZADOR_*`), que são usados pelo seed para criar o primeiro login.

### 4. Migrar e popular

```bash
npm run db:deploy   # cria as tabelas
npm run db:seed     # cria o organizador e uma prova de exemplo
```

O seed imprime no terminal o e-mail e a senha do painel.

### 5. Rodar

```bash
npm run dev
```

- Site: <http://localhost:3000>
- Painel: <http://localhost:3000/admin>

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o Prisma Client e compila para produção |
| `npm start` | Roda a build de produção |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:deploy` | Aplica as migrações (produção) |
| `npm run db:migrate` | Cria uma migração nova (desenvolvimento) |
| `npm run db:seed` | Organizador + prova de exemplo |
| `npm run db:studio` | Prisma Studio, para inspecionar o banco |
| `npm run gerar-segredo` | Gera um valor para `SESSAO_SEGREDO` |

---

## Estrutura

```
app/
  (site)/                    site público
    page.tsx                 home: contagem regressiva + vitrine + como funciona
    evento/[slug]/           página da prova
    evento/[slug]/inscricao/ formulário
    inscricao/[numero]/      confirmação com o número de peito
    privacidade/
  admin/
    login/
    (painel)/                rotas protegidas por sessão
      page.tsx               resumo
      eventos/               CRUD, modalidades e lotes
      eventos/[id]/inscritos tabela, filtros, ações em massa, CSV
      configuracoes/
  api/
    inscricoes/              POST público (rate limit + honeypot)
    inscricoes/[numero]/whatsapp   registra o clique de finalizar
    admin/eventos/[id]/csv   exportação protegida

components/
  vitrine.tsx                scroll-snap + arraste com inércia + teclado
  card-evento.tsx            o número de peito
  formulario-inscricao.tsx   validação em tempo real e rascunho local
  admin/                     campos e painéis do organizador

lib/
  regras.ts                  lote vigente, vagas, selos, número de inscrição
  consultas.ts               leitura com agregação de ocupação
  acoes-admin.ts             Server Actions do painel
  validacao.ts               CPF, telefone, idade, categoria etária
  formatos.ts                moeda, datas e máscaras pt-BR
  auth.ts                    sessão assinada e hash de senha
  rate-limit.ts / csv.ts / schemas.ts
```

---

## Decisões que valem registro

**Tudo que envolve dinheiro e vaga é resolvido no servidor.** O `loteId` que chega
do formulário é conferido contra o lote vigente calculado na hora do envio. Se o
lote virou enquanto a pessoa preenchia, a API responde `409 lote_mudou` com o novo
valor e o formulário pede reconfirmação — o preço nunca vem do cliente.

**O número de inscrição é sequencial por prova, gerado dentro da transação.** O
`UPDATE ... proximo_numero + 1` trava a linha do evento, então dois envios
simultâneos não recebem o mesmo número. As vagas são reconferidas dentro da mesma
transação, o que impede vender além do limite em uma corrida de disputa.

**O painel quase não usa JavaScript.** Cadastro de provas, modalidades, lotes e as
ações sobre inscrições são `<form action={serverAction}>`. Só o login, o formulário
de evento e o de configurações usam `useActionState`, porque precisam devolver
mensagem de erro.

**O site continua de pé sem banco.** Toda leitura pública passa por
`consultaSegura`, que registra o erro e cai no estado vazio já previsto no design.
Isso permite compilar sem `DATABASE_URL` válida e evita página branca se o
Postgres cair.

**Campos fora da especificação original** estão comentados e justificados no topo
de `prisma/schema.prisma`: credenciais do organizador (exigidas pelo login),
`sigla` e `proximo_numero` (exigidos pelo formato do número de inscrição),
`aceita_pix`/`aceita_dinheiro` (forma de pagamento configurável por prova),
`percurso`/`kit`/horários (blocos exigidos pela página da prova) e os campos do
responsável (regra de menor de idade).

---

## Segurança e LGPD

- Validação e sanitização no servidor com Zod, independente do que o cliente já validou.
- Rate limit de 5 inscrições por IP a cada 10 minutos no endpoint público.
- Campo isca (honeypot) contra robôs — sem CAPTCHA, que atrapalharia o público mais velho no celular.
- CPF nunca aparece inteiro fora do painel: a tela de confirmação mostra só os últimos dígitos, e o telefone também vai mascarado.
- Cookie de sessão do painel com `httpOnly`, `secure` em produção e `sameSite=lax`.
- Data, hora e IP do aceite do regulamento e do aceite de dados são gravados na inscrição.
- Página `/privacidade` com finalidade da coleta, tempo de retenção e canal para exclusão.

**Ponto conhecido desta fase:** a tela `/inscricao/[numero]` é aberta por quem tiver
o número, sem login — é o que permite o participante voltar nela pelo histórico do
navegador. Por isso ela mostra apenas dados mascarados e vai com `noindex`. Ao
entrar a fase 2 (área do participante por telefone), vale trocar por um link com
token.

---

## Demonstração estática

Para mostrar o produto sem infraestrutura, o site público pode ser exportado
como HTML estático com provas de exemplo:

```bash
npm run build:demo   # gera out/
```

O build roda sobre uma cópia temporária do projeto — a árvore de trabalho não é
tocada, mesmo se falhar. Na cópia, o painel e as rotas de API saem (precisam de
servidor) e os `dynamic`/`revalidate` viram estáticos. Com `MOVEON_DEMO=1` as
leituras desviam para `lib/demo.ts` em vez do banco, e o formulário valida
normalmente mas leva a uma confirmação de exemplo sem gravar nada. Uma faixa
fixa no topo avisa que é demonstração.

No ar em <https://alexjuniorpinto.github.io/moveon/> (branch `gh-pages`), com o
guia do organizador em `/guia`.

Para republicar depois de mudar o site:

```bash
npm run build:demo
# publique o conteúdo de out/ no branch gh-pages
```

## Deploy

### Vercel

1. Importe o repositório.
2. Configure as variáveis de ambiente do `.env.example`.
3. O build já roda `prisma generate`. Rode `npm run db:deploy` uma vez (localmente apontando para o banco de produção, ou pelo SQL Editor do Supabase com o conteúdo de `prisma/migrations/0_init/migration.sql`).

### VPS com Docker

```bash
cp .env.example .env    # preencha, inclusive SESSAO_SEGREDO
docker compose up -d --build
docker compose exec site npx prisma migrate deploy
docker compose exec site npx tsx prisma/seed.ts
```

Usando Supabase em vez do Postgres local, apague o serviço `banco` do
`docker-compose.yml` e aponte `DATABASE_URL`/`DIRECT_URL` para o Supabase.

Coloque um proxy reverso com HTTPS (Caddy ou Nginx) na frente da porta 3000.

---

## Próximas fases

1. **Fase 2** — Pix automático via gateway (Mercado Pago, Asaas ou Efí) e confirmação automática do status.
2. **Fase 3** — Área do participante por telefone, com histórico, cupom e transferência de inscrição.
3. **Fase 4** — Multi-organizador. O banco já nasceu com `organizador_id` em todas as provas; o que muda é `lib/organizador.ts` e o roteamento por subdomínio.

O documento de requisitos que originou o projeto está em [docs/moveon-master-prompt.json](docs/moveon-master-prompt.json).
Para o organizador, a explicação sem jargão está em [GUIA-DO-ORGANIZADOR.md](GUIA-DO-ORGANIZADOR.md).
