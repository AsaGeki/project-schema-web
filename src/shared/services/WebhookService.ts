import { singleton } from 'tsyringe';

import { logger } from '@shared/services/LoggerService';
import { buildSignaturePayload } from '@shared/utils/auth/buildSignaturePayload';
import { calculateHmac } from '@shared/utils/auth/calculateHmac';
import { wait } from '@shared/utils/time/wait';

const log = logger.child({ prefix: 'webhook' });

export interface IWebhookRequest {
  url: string;
  /** Nome do evento, enviado no corpo e no cabeçalho `x-webhook-event`. */
  event: string;
  payload: unknown;
  /** Segredo do destinatário. Informado, a entrega vai assinada com HMAC. */
  secret?: string;
  /** Tentativas totais, incluindo a primeira. */
  attempts?: number;
  timeoutMs?: number;
}

export interface IWebhookResult {
  delivered: boolean;
  status?: number;
  attempts: number;
  error?: string;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const BACKOFF_BASE_MS = 500;

@singleton()
export default class WebhookService {
  /**
   * Entrega um evento a um endpoint externo, com retentativa em backoff
   * exponencial. Nunca lança: falha de webhook é problema do destinatário e não
   * deve derrubar o fluxo que originou o evento — o resultado é devolvido para
   * quem chamou decidir o que fazer.
   */
  public async send(request: IWebhookRequest): Promise<IWebhookResult> {
    const attempts = request.attempts ?? DEFAULT_ATTEMPTS;
    const body = JSON.stringify({ event: request.event, payload: request.payload, sentAt: new Date().toISOString() });

    let lastError = '';

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await this.deliver(request, body);

      if (result.delivered) {
        log.info(`Evento ${request.event} entregue em ${request.url} (tentativa ${attempt}).`);
        return { ...result, attempts: attempt };
      }

      lastError = result.error ?? 'falha desconhecida';

      if (attempt < attempts) {
        // Backoff exponencial: 500ms, 1s, 2s — dá tempo de um destinatário
        // sobrecarregado se recuperar, sem prender o processo.
        await wait(BACKOFF_BASE_MS * 2 ** (attempt - 1));
      }
    }

    log.warn(`Evento ${request.event} não entregue em ${request.url} após ${attempts} tentativas: ${lastError}`);
    return { delivered: false, attempts, error: lastError };
  }

  private async deliver(request: IWebhookRequest, body: string): Promise<Omit<IWebhookResult, 'attempts'>> {
    const timestamp = String(Date.now());

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-webhook-event': request.event,
      'x-webhook-timestamp': timestamp,
    };

    // Assinatura opcional: o destinatário confere que o evento veio daqui, com
    // o mesmo formato canônico usado nas integrações de entrada.
    if (request.secret) {
      const url = new URL(request.url);
      const payload = buildSignaturePayload('POST', `${url.pathname}${url.search}`, timestamp, body);
      headers['x-webhook-signature'] = calculateHmac(request.secret, payload);
    }

    try {
      const response = await fetch(request.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });

      if (response.ok) return { delivered: true, status: response.status };

      return { delivered: false, status: response.status, error: `HTTP ${response.status}` };
    } catch (error) {
      return { delivered: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
