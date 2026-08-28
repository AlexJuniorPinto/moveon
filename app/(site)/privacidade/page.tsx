import type { Metadata } from "next";
import { organizadorPrincipal } from "@/lib/organizador";
import { telefoneLegivel } from "@/lib/formatos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Aviso de privacidade",
  description: "Quais dados o MoveON coleta na inscrição, por quanto tempo guarda e como pedir a exclusão.",
};

const SECOES = [
  {
    titulo: "O que coletamos",
    itens: [
      "Nome completo, CPF e data de nascimento, para identificar você na largada e na premiação por categoria.",
      "Telefone e e-mail, para falar com você sobre a prova.",
      "Sexo, para definir a categoria da premiação.",
      "Tamanho e modelo da camisa, para o pedido na confecção.",
      "Nome e telefone de um contato de emergência, usado apenas se algo acontecer com você durante a prova.",
      "Data, hora e endereço de IP do momento em que você aceitou o regulamento e este aviso.",
    ],
  },
  {
    titulo: "Para que usamos",
    itens: [
      "Organizar a prova: lista de largada, numeração, kits e premiação.",
      "Falar com você pelo WhatsApp sobre pagamento, retirada de kit e mudanças no evento.",
      "Cumprir obrigações legais ligadas à realização do evento.",
    ],
  },
  {
    titulo: "Com quem compartilhamos",
    itens: [
      "Ninguém, além dos prestadores necessários para realizar a prova (confecção das camisas, equipe de apoio e cronometragem, quando houver).",
      "Não vendemos nem cedemos seus dados para publicidade de terceiros.",
    ],
  },
];

export default async function PaginaPrivacidade() {
  const organizador = await organizadorPrincipal();

  return (
    <div className="pagina max-w-2xl py-12 md:py-16">
      <p className="rotulo text-traco">MoveON</p>
      <h1 className="mt-3 text-2xl">Aviso de privacidade</h1>
      <p className="mt-4 text-traco">
        Este aviso explica quais dados pedimos na inscrição, por que pedimos, quanto tempo
        guardamos e como você pede a exclusão.
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {SECOES.map((secao) => (
          <section key={secao.titulo}>
            <h2 className="text-lg">{secao.titulo}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {secao.itens.map((item) => (
                <li key={item} className="border-l border-azul pl-4 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h2 className="text-lg">Por quanto tempo guardamos</h2>
          <p className="mt-4 text-sm">
            Os dados da inscrição ficam guardados por 5 anos após a data da prova, prazo em
            que ainda podem ser necessários para comprovar sua participação e o aceite do
            regulamento. Depois disso são apagados.
          </p>
        </section>

        <section>
          <h2 className="text-lg">Seus direitos</h2>
          <p className="mt-4 text-sm">
            Você pode pedir a qualquer momento para ver, corrigir ou apagar seus dados, e
            também retirar a autorização de uso. Se você apagar seus dados antes da prova, a
            inscrição é cancelada, porque não temos como colocar você na largada sem eles.
          </p>
          {organizador && (
            <p className="mt-4 text-sm">
              Para pedir, fale com {organizador.nome} no WhatsApp{" "}
              <a
                href={`https://wa.me/${organizador.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dados font-medium text-azul underline underline-offset-4"
              >
                {telefoneLegivel(organizador.whatsapp)}
              </a>
              . Respondemos em até 15 dias.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-lg">Segurança</h2>
          <p className="mt-4 text-sm">
            O site usa conexão criptografada (HTTPS). Seu CPF nunca aparece inteiro em
            páginas públicas — na tela de confirmação mostramos apenas os últimos dígitos. O
            acesso à lista completa de inscritos exige login do organizador.
          </p>
        </section>
      </div>
    </div>
  );
}
