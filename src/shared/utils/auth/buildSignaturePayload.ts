/**
 * Formato canônico assinado por cliente e servidor:
 * `METHOD\nPATH\nTIMESTAMP\nRAW_BODY`.
 *
 * `path` é a URL original completa, com query string — assim trocar um
 * parâmetro sem reassinar já invalida a requisição. `rawBody` é vazio quando a
 * requisição não tem corpo.
 */
export function buildSignaturePayload(method: string, path: string, timestamp: string, rawBody: string): string {
  return `${method}\n${path}\n${timestamp}\n${rawBody}`;
}
