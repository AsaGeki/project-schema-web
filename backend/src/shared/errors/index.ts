/**
 * Classe base para tratamento de erros customizados
 * Padrão referência: universal/PADRAO-ERROS.md
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Erros HTTP por status code - Use conforme o contexto
 */

/**
 * 400 Bad Request - Dados inválidos ou formatação incorreta
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Requisição inválida.') {
    super(message, 400);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized - Não autenticado (token ausente ou inválido)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado.') {
    super(message, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden - Autenticado mas sem permissão para acessar
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado.') {
    super(message, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found - Recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Registro não encontrado.') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Conflito com estado atual (ex.: e-mail já em uso)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflito com o estado atual.') {
    super(message, 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity - Regras de negócio não atendidas
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Entidade não processável.') {
    super(message, 422);
    this.name = 'UnprocessableEntityError';
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * 429 Too Many Requests - Rate limit excedido
 */
export class TooManyRequestsError extends AppError {
  constructor(
    message: string = 'Muitas requisições. Tente novamente mais tarde.'
  ) {
    super(message, 429);
    this.name = 'TooManyRequestsError';
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

/**
 * 500 Internal Server Error - Erro inesperado
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor.') {
    super(message, 500);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
