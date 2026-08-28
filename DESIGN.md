# DESIGN.md — MoveON

## Conceito

A referência não é "site de evento". É o **kit de corrida**: papel do número de
peito, tipografia de cronômetro, cor de cone e de fita de chegada.

**Elemento-assinatura:** o card da vitrine é um número de peito **em movimento**.
Furos de perfuração no topo, a maior distância da prova em numerais tabulares
inclinados 7° — como o número no peito de quem está correndo — e uma faixa
inferior escura com a data e o preço, no lugar da tarja de patrocínio, que o
azul preenche da esquerda para a direita quando o ponteiro passa.
O mesmo idioma se repete no card de preço da página da prova, no resumo do
formulário e — o momento de pagamento da jornada — na tela de confirmação, onde o
sequencial da inscrição aparece em tamanho de peitoral.

A boldness fica concentrada aí. Todo o resto é linha de 1px e contraste de cor.

## Tokens

Definidos em `app/globals.css`, no bloco `@theme` do Tailwind 4.

### Cor

| Token | Hex | Uso |
|---|---|---|
| `azul` | `#16277A` | Estrutura, títulos de dado, numerais, foco |
| `verde` | `#00C2A8` | Ações de avanço (inscrever, finalizar no WhatsApp) e a fita de chegada, que é a mesma ideia em forma de textura |
| `amarelo` | `#FFD23F` | **Só** urgência: últimas vagas, lote virando |
| `asfalto` | `#20242B` | Fundo das seções fortes e texto padrão |
| `papel` | `#F6F5F1` | Base geral |
| `traco` | `#8E939C` | Texto secundário e linhas |
| `erro` | `#B3261E` | Mensagens de erro |

Verde e amarelo nunca aparecem no mesmo componente: um convida a avançar, o outro
avisa de risco. Juntos, cancelam-se.

### Tipografia

| Papel | Família | Onde |
|---|---|---|
| Display | Archivo 800, `font-stretch: 125%` | Títulos, marca, numerais |
| Corpo | Public Sans | Textos, labels, formulário |
| Dados | IBM Plex Mono | Número de inscrição, distâncias, horários, valores em tabela |

Escala: 12 / 14 / 16 / 20 / 28 / 40 / 64. Entrelinha 1.2 no display, 1.55 no corpo.

**Uma exceção à escala:** a contagem regressiva da home e o sequencial da tela de
confirmação usam `clamp()` e passam de 64px em telas grandes. São os dois momentos
em que um número *é* o conteúdo, não um rótulo dele.

### Forma e profundidade

- Raio: 4px em inputs e botões. **0px** nos cards de evento — o número de peito é reto.
- Sombra: nenhuma no papel. Separação por contraste de cor e linha de 1px.
  A única exceção é a placa do hero, que está apoiada sobre uma fotografia e
  precisa parecer um objeto físico em cima dela: sombra com deslocamento e
  desfoque de verdade, nunca um halo colorido sem offset.
- Altura mínima de alvo de toque: 48px nos botões principais, 44px nos demais.

## Hero

A foto é de contraluz no nascer do sol: silhuetas, sombras longas no asfalto e
o sol atrás do pelotão. **O tratamento existe para servir essa luz, não para
apagá-la.** Por isso nenhuma camada é preto chapado — preto sobre ouro devolve
marrom. Todo o escurecimento é asfalto azulado (`rgb(9 13 22)`), em quatro
camadas com trabalhos distintos:

1. Um radial ancorado no canto de baixo à esquerda, onde o texto vive. É o
   único ponto que chega a 94% de opacidade.
2. Uma faixa de base, para a placa e a linha de ritmo assentarem.
3. Uma faixa de topo, porque o cabeçalho passa transparente por cima.
4. Uma vinheta **centrada no sol** — as bordas caem, a luz fica.

Por cima disso, uma camada em `mix-blend-mode: screen` devolve o brilho quente
do sol que o scrim comeria. E o `object-position` da foto acompanha o sol
(58%/45%, 66%/42% no mobile) para vinheta e brilho caírem no lugar em qualquer
proporção de tela.

O cabeçalho fica **transparente enquanto a página está no topo** e só então: o
primeiro viewport é a fotografia inteira, não a fotografia com uma tarja clara
grudada em cima. A troca é decidida pelo CSS a partir de `data-topo` — nas
páginas sem hero ele é papel sólido em qualquer posição de rolagem.

**Placa de cronômetro** (`.placa`) — o painel de largada, e a âncora do
numeral, que antes flutuava solto no meio da foto. É a mesma tarja escura do pé
do peitoral, agora como instrumento: a contagem é a leitura, e os dados da prova
ficam em colunas tabulares ao lado, separadas por fio de 1px. Ela tem ground
próprio, o que resolve a legibilidade localmente — é por isso que o `text-shadow`
genérico que existia em todo `h1`, `p` e `a` do hero pôde ser desligado. Sobra
uma sombra curta no título e na linha de apoio, que ficam direto sobre a foto;
o botão e a placa não levam sombra nenhuma.

## Fundo

O conceito é papel de peitoral, então o papel tem superfície: um grão cinza fino
a 5% sobre a página inteira (`body::after`, `feTurbulence` inline — nenhuma
imagem carregada). No claro ele lê como textura de impressão; sobre o asfalto e
a foto, como grão de filme.

Alfa normal, **não** `mix-blend-mode`: uma camada mesclada do tamanho do
viewport obriga o navegador a remesclar a tela inteira a cada quadro de
rolagem, e a 5% a diferença visual entre as duas é nenhuma.

E a luz da hora dourada não morre no corte do hero: `.luz-papel` escorre um
clarão quente para dentro dos primeiros 460px da seção seguinte, para a
passagem de escuro para claro não ser uma guilhotina. É luz, não cor de marca:
não conta como uso do `amarelo`.

## Dispositivos gráficos

Três texturas emprestadas da prova, todas em CSS puro — nenhuma carrega imagem:

- **Fita de chegada** (`.fita`) — faixa de 8px com listras diagonais em verde
  sobre asfalto, fechando cada bloco escuro. É a única peça que usa verde fora
  de um botão, e usa por ser literalmente a linha de chegada.
- **Raias** (`.raias`) — linhas diagonais a 115° com 4% de opacidade nos blocos
  de asfalto. Textura, não decoração: some se você olhar de perto.
- **Linha de ritmo** (`.linha-ritmo`) — traços de 9px inclinados a -14° correndo
  no pé do hero, com uma passada verde cruzando de tempos em tempos. É a
  marcação da raia passando sob quem corre; substituiu a fita naquele bloco,
  porque ali o assunto é continuar, não chegar. As pontas somem numa máscara
  para a repetição não denunciar a emenda.

## Movimento

Arquétipo **enérgico**: saída rápida, chegada macia, sem quique.

```
--ease-mv:     cubic-bezier(0.2, 0, 0, 1)     mudança de estado
--ease-saida:  cubic-bezier(0.16, 1, 0.3, 1)  entrada (expo.out)
--dur-toque:   110ms   pressionar
--dur-estado:  180ms   hover, cor, borda
--dur-entrada: 420ms   entrada de bloco
```

Onde há movimento e por quê:

**O momento autoral é a abertura do hero**, e ele tem três camadas em vez de
uma cascata solta:

- *Ambiente* — a foto entra a `scale(1.07)` e chega em 1 em 1,7s de expo.out.
  Uma aproximação que **para**: não é laço, não é Ken Burns.
- *Primária* — os quatro blocos do conteúdo sobem 24px saindo de `blur(10px)`,
  620ms, escalonados de 70 em 70ms.
- *Secundária* — o numeral rola de trás da máscara aos 230ms, quando a placa
  já chegou ao lugar. O dígito vira depois que o instrumento ligou.

Onde há movimento e por quê:

| Lugar | Movimento | Comunica |
|---|---|---|
| Foto do hero | Aproxima de 1,07 a 1 em 1,7s e para | Que a cena está viva, sem virar papel de parede animado |
| Conteúdo do hero | Sobe 24px saindo de foco, em cascata de 70ms | Ordem de leitura, e a chegada do assunto |
| Contagem regressiva | Sobe de trás de uma máscara, 620ms, aos 230ms | Dígito de cronômetro virando |
| Cabeçalho | Fundo e fio aparecem em 240ms ao sair do topo | Que saímos da foto e entramos na página |
| Vitrine | `scroll-snap` + inércia no arraste | Que dá para arrastar, e onde o card para |
| Cards e passos | Revelam em cascata de 65ms ao entrar na tela | Ordem de leitura |
| Card em foco | Faixa preenche de azul da esquerda, numeral avança 4px, capa cresce 3% | Que ele é clicável, e que o assunto é avançar |
| Barra de progresso | Translada com o scroll | Quanto ainda tem para o lado |
| Botões | `scale(0.985)` ao pressionar, seta desliza no hover | Que o toque foi registrado |
| Pé do hero | Traços correm a 29px/s em laço contínuo; a passada verde cruza a cada 6,2s | Passo constante — a prova segue |

A revelação em cascata depende da classe `js`, colocada no `<html>` antes da
primeira pintura. Sem JavaScript o conteúdo aparece normalmente — nunca fica
preso invisível.

`prefers-reduced-motion` desliga a inércia, a cascata, a máscara, a aproximação
da foto, a linha de ritmo e o scroll suave; a inclinação dos numerais e a dos
traços fica, porque é forma, não movimento. A luz, o grão e a placa também
ficam: são superfície, não animação.

## Rolagem

A vitrine **nunca** sequestra o gesto vertical: com o cursor em cima dela, a
página rola normalmente. Só o gesto horizontal (trackpad ou roda lateral) move
os cards, e move de card em card.

Somar pixels no `scrollLeft` a cada evento de roda brigava com o
`scroll-snap-type: x mandatory` — o snap puxava tudo de volta para o card e o
gesto era engolido, travando a página e a vitrine ao mesmo tempo. Por isso a
roda salta para o card vizinho, com trava de 420ms para um gesto não pular
vários.

## Vitrine

- **Toque:** scroll nativo com `scroll-snap-type: x mandatory`. Nada é interceptado, o momentum do sistema continua valendo.
- **Mouse:** arraste com inércia. O modo de arraste só liga depois de 6px de movimento — abaixo disso é clique, e o card abre.
- **Roda:** só o gesto horizontal move os cards, e move de card em card. O gesto vertical nunca é interceptado — ver "Rolagem" acima.
- **Teclado:** a vitrine é uma região focável; as setas andam de card em card. Cada card é um link alcançável por Tab.
- Largura do card: 82vw no mobile (o próximo "espia" na borda e indica o arraste) e 360px no desktop.
- O recuo interno acompanha a margem da página e, em telas largas, o alinhamento da coluna de conteúdo.

## Modos por superfície

- **Home e página da prova:** persuadir. O visitante decide e age.
- **Formulário e confirmação:** operar. Clareza e ritmo acima de expressão.
- **Painel do organizador:** operar. Denso, escaneável, mesma paleta, zero enfeite.
- **Privacidade:** ler. Estrutura para compreensão.

## Regras que não se quebram

1. Mobile-first de verdade: desenhar a 375px e só então expandir.
2. Contraste mínimo AA em todo texto.
3. Foco visível em tudo que é interativo — amarelo sobre fundo escuro, azul sobre claro.
4. Label real associado a cada input. Placeholder nunca é label.
5. Erro embaixo do campo, em texto direto, anunciado por `role="alert"`.
6. Nada de ilustração genérica de corredor ou foto de banco de imagem. A foto do hero é da própria organização, e o escurecimento por cima dela existe para o texto passar em AA — é contraste, não gradiente decorativo. Na capa da prova, enquanto não houver a foto real, o espaço fica reservado com o nome do evento.
7. Escurecer foto é trabalho de luz, não de opacidade. Preto chapado sobre a hora dourada devolve marrom: o peso vem do asfalto azulado, chega concentrado onde o texto está e nunca cobre o sol por igual.
8. Nada de rótulo em cima de título. Se o título precisa de um chapéu para se explicar, o título é que está errado.
