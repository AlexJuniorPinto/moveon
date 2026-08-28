/**
 * CSV para o Excel brasileiro: separador ";" e UTF-8 com BOM, senão a acentuação
 * abre quebrada.
 */
export function montaCsv(cabecalho: string[], linhas: (string | number | null)[][]): string {
  const escapa = (valor: string | number | null) => {
    const texto = valor == null ? "" : String(valor);
    return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const corpo = [cabecalho, ...linhas]
    .map((linha) => linha.map(escapa).join(";"))
    .join("\r\n");

  return `\uFEFF${corpo}`;
}

export function respostaCsv(conteudo: string, nomeArquivo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
