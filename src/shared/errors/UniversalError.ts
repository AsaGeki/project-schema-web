export interface IUniversalErrorInput {
  title?: string | undefined;
  message?: string | undefined;
  status?: number | undefined;
  code?: string | undefined;
  details?: unknown;
  data?: unknown;
  operation?: string | undefined;
  originalError?: unknown;
}

/** Entrada aceita pelos erros: uma `string` (vira `message`) ou o objeto de opções completo. */
export type TUniversalErrorInput = string | IUniversalErrorInput;

/** Normaliza a entrada: `string` vira `{ message }`; objeto passa direto. */
function normalizeErrorInput(input: TUniversalErrorInput = {}): IUniversalErrorInput {
  return typeof input === 'string' ? { message: input } : input;
}

export interface ISerializedUniversalError {
  name: string;
  title: string;
  message: string;
  code?: string;
  details?: unknown;
  data?: unknown;
  operation?: string;
}

export class UniversalError extends Error {
  public readonly title: string;
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly data?: unknown;
  public readonly operation?: string;
  public readonly originalError?: unknown;

  constructor(input: TUniversalErrorInput = {}) {
    const options = normalizeErrorInput(input);
    const status = options.status ?? 500;
    const message = options.message ?? ErrorService.messageForStatus(status, options.operation);

    super(message);

    this.name = this.constructor.name;
    this.title = options.title ?? ErrorService.titleForStatus(status);
    this.status = status;

    if (options.code) this.code = options.code;
    if (options.details !== undefined) this.details = options.details;
    if (options.data !== undefined) this.data = options.data;
    if (options.operation !== undefined) this.operation = options.operation;
    if (options.originalError !== undefined) this.originalError = options.originalError;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): ISerializedUniversalError {
    const serialized: ISerializedUniversalError = {
      name: this.name,
      title: this.title,
      message: this.message,
    };

    if (this.code) serialized.code = this.code;
    if (this.details !== undefined) serialized.details = this.details;
    if (this.data !== undefined) serialized.data = this.data;
    if (this.operation !== undefined) serialized.operation = this.operation;

    return serialized;
  }
}

export class ErrorService {
  static titleForStatus(status: number): string {
    switch (status) {
      case 400:
        return 'Requisição inválida!';
      case 401:
        return 'Não autorizado!';
      case 403:
        return 'Proibido!';
      case 404:
        return 'Não encontrado!';
      case 409:
        return 'Conflito de dados!';
      case 410:
        return 'Expirado!';
      case 413:
        return 'Payload grande demais!';
      case 415:
        return 'Tipo de mídia não suportado!';
      case 422:
        return 'Erro de validação!';
      case 429:
        return 'Muitas requisições!';
      case 503:
        return 'Serviço indisponível!';
      default:
        return 'Erro interno do servidor!';
    }
  }

  static messageForStatus(status: number, operation?: string): string {
    const operationText = operation ? ` ${operation}` : '';

    switch (status) {
      case 401:
        return 'Sessão expirada. Por favor, faça login novamente.';
      case 403:
        return `Você não tem permissão para${operationText}.`;
      case 404:
        return `O recurso${operationText} não foi encontrado.`;
      case 422:
        return `Dados inválidos para${operationText}.`;
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      case 503:
        return 'Serviço temporariamente indisponível.';
      default:
        return `Ocorreu um erro${operationText}. Tente novamente.`;
    }
  }
}

type TStatusErrorOptions = Omit<IUniversalErrorInput, 'status'>;
type TStatusErrorInput = string | TStatusErrorOptions;

export class BadRequestError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 400 });
  }
}

export class UnauthorizedError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 401 });
  }
}

export class ForbiddenError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 403 });
  }
}

export class NotFoundError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 404 });
  }
}

export class ConflictError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 409 });
  }
}

export class GoneError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 410 });
  }
}

export class PayloadTooLargeError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 413 });
  }
}

export class UnsupportedMediaTypeError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 415 });
  }
}

export class UnprocessableEntityError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 422 });
  }
}

export class TooManyRequestsError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 429 });
  }
}

export class InternalServerError extends UniversalError {
  constructor(options: TStatusErrorInput = {}) {
    super({ ...normalizeErrorInput(options), status: 500 });
  }
}
