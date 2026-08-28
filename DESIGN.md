# DESIGN.md — MoveON

## Conceito

A referência não é "site de evento". É o **kit de corrida**: papel do número de
peito, tipografia de cronômetro, cor de cone e de fita de chegada.

**Elemento-assinatura:** o card da vitrine é um número de peito. Furos de
perfuração no topo, a maior distância da prova em numerais tabulares grandes, e
uma faixa inferior escura com a data e o preço, no lugar da tarja de patrocínio.
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
| `verde` | `#00C2A8` | **Só** ações de avanço: inscrever e finalizar no WhatsApp |
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

## Movimento

Uma curva, três durações. Nada decorativo.

```
--ease-mv:    cubic-bezier(0.2, 0, 0, 1)
--dur-toque:  120ms   pressionar
--dur-estado: 200ms   hover, cor, borda
--dur-entrada: 320ms  entrada de bloco
```

Onde há movimento e por quê:

| Lugar | Movimento | Comunica |
|---|---|---|
| Vitrine | `scroll-snap` + inércia leve no arraste | Que dá para arrastar, e onde o card para |
| Barra de progresso | Translada com o scroll | Quanto ainda tem para o lado |
| Botões | `scale(0.985)` ao pressionar | Que o toque foi registrado |
| Card | Borda escurece, faixa vira azul | Que ele é clicável |

`prefers-reduced-motion` desliga a inércia, o scroll suave e todas as transições.

## Vitrine

- **Toque:** scroll nativo com `scroll-snap-type: x mandatory`. Nada é interceptado, o momentum do sistema continua valendo.
- **Mouse:** arraste com inércia. O modo de arraste só liga depois de 6px de movimento — abaixo disso é clique, e o card abre.
- **Roda:** vertical vira horizontal, mas o gesto volta para a página quando a vitrine chega ao fim.
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
6. Nada de gradiente em hero, ilustração genérica de corredor ou foto de banco de imagem. Enquanto não houver a foto real da prova, o espaço fica reservado com o nome do evento.
