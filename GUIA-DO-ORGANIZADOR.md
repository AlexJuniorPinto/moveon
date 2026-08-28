# Guia do organizador

Como usar o painel do MoveON. Não precisa saber nada de programação.

---

## Entrar

1. Abra `seusite.com.br/admin`.
2. Digite seu e-mail e sua senha.

Você fica conectado por 7 dias. Para sair antes, clique em **Sair**, no canto
superior direito.

**Esqueceu a senha?** Só quem tem acesso ao servidor consegue redefinir. Peça a
quem cuida do site. Se você ainda está conectado, dá para trocar a senha em
**Configurações**.

---

## Criar uma prova

Uma prova nasce como **rascunho**: ela existe no painel, mas ninguém vê no site.
Ela só aparece para o público quando você clica em **Publicar**.

### Passo 1 — cadastrar

Clique em **Provas → Criar prova**. Os campos obrigatórios são poucos:

- **Nome da prova** — como aparece na vitrine. Ex.: `Corrida do Fogo 2026`
- **Data e hora da prova** — o horário da largada
- **Local**, **Cidade** e **UF**

O resto é opcional e pode ser preenchido depois.

Dois campos merecem atenção:

- **Endereço no site** — o final do link da prova. Se deixar em branco, o sistema
  cria a partir do nome (`corrida-do-fogo-2026`). Depois que a prova estiver no ar
  e divulgada, evite mudar: os links antigos param de funcionar.
- **Sigla** — três letras que entram no número de inscrição.
  `CFO` gera `MV-2026-CFO-0087`. Se deixar em branco, o sistema usa as iniciais do nome.

### Passo 2 — modalidades

São os percursos: `5 km`, `10 km`, `Caminhada 3 km`, `Kids`.

| Campo | Para que serve |
|---|---|
| Nome | O que o participante escolhe no formulário |
| Distância | Alimenta o número grande no card da vitrine |
| Idade mínima | A modalidade fica bloqueada para quem for mais novo na data da prova |
| Vagas | Deixe em branco se não houver limite por percurso |
| Ordem | 0 aparece primeiro |

Preencha a linha pontilhada e clique em **Adicionar**. Para mudar algo depois,
edite a linha e clique em **Salvar**.

### Passo 3 — lotes

São as faixas de preço. O sistema usa **o primeiro lote ativo cuja data de hoje
está dentro da janela e que ainda tem vaga**, seguindo a ordem que você definiu.

Exemplo com três lotes:

| Nome | Preço | Início | Fim | Ordem |
|---|---|---|---|---|
| 1º lote | 60,00 | — | 30/06 | 0 |
| 2º lote | 75,00 | 01/07 | 31/07 | 1 |
| 3º lote | 90,00 | 01/08 | 25/08 | 2 |

Deixar o **Início** em branco significa "vale desde já". Deixar o **Fim** em branco
significa "vale até acabar". A virada é automática, na data e hora que você marcou.

> Se alguém abrir o formulário no 1º lote e enviar depois da virada, o sistema
> avisa o novo valor e pede confirmação antes de gravar. Ninguém paga o preço antigo
> por engano, e ninguém é cobrado a mais sem saber.

### Passo 4 — publicar

O botão **Publicar** só libera depois que existir pelo menos uma modalidade e um
lote. Publicou, a prova entra na vitrine da home, ordenada pela data mais próxima.

Marque **Destacar na vitrine** para a prova aparecer primeiro, na frente das outras.

---

## Enquanto as inscrições estão abertas

### Ver quem se inscreveu

**Provas → Inscritos**. A lista atualiza sozinha: assim que alguém envia o
formulário, aparece ali.

Cada inscrição tem um status:

| Status | O que significa |
|---|---|
| **Pendente** | Enviou o formulário e ainda não foi para o WhatsApp |
| **Aguardando confirmação** | Clicou em "Finalizar no WhatsApp". Provavelmente já está te chamando |
| **Confirmada** | Você recebeu o pagamento e confirmou aqui |
| **Cancelada** | Desistiu ou não pagou |

O status muda de pendente para "aguardando confirmação" sozinho, no clique do
participante. **Confirmada** e **cancelada** são sempre você quem marca.

### Confirmar um pagamento

Recebeu o Pix? Duas formas:

- **Uma pessoa:** clique em **Confirmar** na linha dela.
- **Várias:** marque as caixinhas e clique em **Marcar como confirmada**.

### Achar uma pessoa

Use a busca por nome, CPF ou telefone. Os filtros de status, modalidade e lote
podem ser combinados com a busca.

Clicando no telefone de alguém, o WhatsApp abre direto na conversa.

---

## Fechar o pedido das camisas

Na tela de inscritos, o bloco **Camisas a pedir** já traz a contagem por tamanho e
por modelo, separando masculina e baby look. É o número para levar à confecção.

A conta ignora inscrições canceladas. Como ela inclui as pendentes, feche o pedido
depois do prazo de pagamento, senão você produz camisa para quem desistiu.

---

## Baixar a lista completa

**Baixar CSV** entrega uma planilha com todos os campos, incluindo a categoria
etária calculada para a premiação (até 19, 20-29, 30-39, e assim por diante).

O arquivo abre direto no Excel com a acentuação certa. Ele respeita os filtros da
tela: se você filtrou por "10 km" e "confirmada", baixa só essas.

---

## Encerrar

Você tem três formas de tirar uma prova do ar, e elas são diferentes:

- **Tirar do ar** — volta para rascunho. Some do site, continua no painel, dá para publicar de novo.
- **Encerrado** — a página continua no ar, mas o formulário fecha. É o que usar depois da prova.
- **Arquivar** — some do site e do painel. As inscrições continuam guardadas no banco, mas você não desfaz isso pelo painel.

As inscrições também fecham sozinhas quando chega a data em **Fecham em**, quando
o limite de vagas é atingido ou quando a data da prova passa.

---

## Perguntas frequentes

**Duas pessoas podem se inscrever com o mesmo CPF na mesma prova?**
Não. O sistema bloqueia e manda a pessoa falar com você. Em provas diferentes, sim.

**E se as vagas acabarem no meio de uma inscrição?**
O sistema confere as vagas na hora de gravar. Se acabaram, ele avisa e não grava —
você não fica com mais inscritos do que vagas.

**Menor de idade pode se inscrever?**
Pode. Se a pessoa tiver menos de 18 anos na data da prova, o formulário pede nome e
CPF do responsável e avisa que o termo assinado deve ser entregue na retirada do kit.

**Posso mudar a chave Pix?**
Sim, em **Configurações**. Ela não aparece no site: fica ali só para você copiar
rápido quando for responder no WhatsApp.

**Como coloco a foto da prova?**
Em **Provas → Editar → Link da foto de capa**, cole o endereço de uma imagem
hospedada. Enquanto não houver foto, o card mostra o nome da prova em um bloco
neutro — nada quebra.
