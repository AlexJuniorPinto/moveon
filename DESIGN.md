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
- Sombra: nenhuma. Separação por contraste de cor e linha de 1px.
- Altura mínima de alvo de toque: 48px nos botões principais, 44px nos demais.

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

| Lugar | Movimento | Comunica |
|---|---|---|
| Contagem regressiva | Sobe de trás de uma máscara, 620ms | Dígito de cronômetro virando |
| Vitrine | `scroll-snap` + inércia no arraste | Que dá para arrastar, e onde o card para |
| Cards e passos | Revelam em cascata de 65ms ao entrar na tela | Ordem de leitura |
| Card em foco | Faixa preenche de azul da esquerda, numeral avança 4px, capa cresce 3% | Que ele é clicável, e que o assunto é avançar |
| Barra de progresso | Translada com o scroll | Quanto ainda tem para o lado |
| Botões | `scale(0.985)` ao pressionar, seta desliza no hover | Que o toque foi registrado |
| Pé do hero | Traços correm a 29px/s em laço contínuo; a passada verde cruza a cada 6,2s | Passo constante — a prova segue |

A revelação em cascata depende da classe `js`, colocada no `<html>` antes da
primeira pintura. Sem JavaScript o conteúdo aparece normalmente — nunca fica
preso invisível.

`prefers-reduced-motion` desliga a inércia, a cascata, a máscara, a linha de
ritmo e o scroll suave; a inclinação dos numerais e a dos traços fica, porque é
forma, não movimento.

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
