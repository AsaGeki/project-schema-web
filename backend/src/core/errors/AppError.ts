/**
 * Interface para definir as opções de erro utilizadas nas classes da aplicação.
 */
export interface IAppErrorOptions {
  message?: string;
  title?: string;
  details?: unknown;
  isOperational?: boolean;
}

type ErrorInput = string | IAppErrorOptions;

/**
 * Classe base robusta para tratamento de erros customizados.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly title?: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly originFile?: string;

  constructor(input: ErrorInput, defaultStatusCode: number = 500) {
    const isString = typeof input === 'string';
    const message = isString
      ? input
      : input.message || 'Erro interno no servidor.';

    super(message);

    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = defaultStatusCode;
    this.title = isString ? undefined : input.title;
    this.details = isString ? undefined : input.details;
    this.isOperational = isString ? true : input.isOperational !== false;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    if (this.stack) {
      const stackLines = this.stack.split('\n');
      const callerLine = stackLines[1];

      if (callerLine) {
        const matchRegex = callerLine.match(/\((.*)\)/);
        this.originFile = matchRegex
          ? matchRegex[1]
          : callerLine.trim().replace(/^at\s+/, '');
      }
    }
  }
}

/** 400 Bad Request - Dados inválidos ou formatação incorreta */
export class BadRequestError extends AppError {
  constructor(input: ErrorInput = 'Requisição inválida.') {
    super(input, 400);
  }
}

/** 401 Unauthorized - Não autenticado (token ausente ou inválido) */
export class UnauthorizedError extends AppError {
  constructor(input: ErrorInput = 'Não autorizado.') {
    super(input, 401);
  }
}

/** 403 Forbidden - Autenticado, mas sem permissão para acessar */
export class ForbiddenError extends AppError {
  constructor(input: ErrorInput = 'Acesso negado.') {
    super(input, 403);
  }
}

/** 404 Not Found - Recurso não encontrado */
export class NotFoundError extends AppError {
  constructor(input: ErrorInput = 'Registro não encontrado.') {
    super(input, 404);
  }
}

/** 409 Conflict - Conflito com estado atual */
export class ConflictError extends AppError {
  constructor(input: ErrorInput = 'Conflito com o estado atual.') {
    super(input, 409);
  }
}

/** 422 Unprocessable Entity - Regras de negócio não atendidas */
export class UnprocessableEntityError extends AppError {
  constructor(input: ErrorInput = 'Entidade não processável.') {
    super(input, 422);
  }
}

/** 429 Too Many Requests - Rate limit excedido */
export class TooManyRequestsError extends AppError {
  constructor(
    input: ErrorInput = 'Muitas requisições. Tente novamente mais tarde.'
  ) {
    super(input, 429);
  }
}

/** 500 Internal Server Error - Erro inesperado (não operacional por padrão) */
export class InternalServerError extends AppError {
  constructor(input: ErrorInput = 'Erro interno do servidor.') {
    const options =
      typeof input === 'string'
        ? { message: input, isOperational: false }
        : { ...input, isOperational: input.isOperational ?? false };

    super(options, 500);
  }
}
