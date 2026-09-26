import type { UniversalError } from '@shared/errors/UniversalError';
import { BadRequestError, ConflictError, UnprocessableEntityError } from '@shared/errors/UniversalError';

/** Nomes de erro do Mongoose/driver que têm tradução própria. */
const MONGO_ERROR_NAMES = ['MongoServerError', 'ValidationError', 'CastError', 'MongoBulkWriteError'];

interface IMongoError {
  name: string;
  code?: number;
  message: string;
  path?: string;
  errors?: Record<string, { message: string; path?: string }>;
}

export function isMongoError(error: unknown): error is IMongoError {
  return typeof error === 'object' && error !== null && MONGO_ERROR_NAMES.includes((error as IMongoError).name);
}

export function mapMongoError(error: IMongoError): UniversalError {
  // 11000 é a violação de índice único, tanto no insert quanto no bulk.
  if (error.code === 11000) {
    return new ConflictError({ message: 'Já existe um registro com o mesmo valor único.', code: 'E11000' });
  }

  if (error.name === 'CastError') {
    return new BadRequestError({
      message: `O valor informado para ${error.path ?? 'o campo'} não é válido.`,
      code: error.name,
    });
  }

  if (error.name === 'ValidationError') {
    return new UnprocessableEntityError({
      message: 'Erro de validação dos dados fornecidos.',
      code: error.name,
      details: Object.values(error.errors ?? {}).map(issue => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  }

  return new BadRequestError({ message: 'Não foi possível concluir a operação no banco de dados.', code: error.name });
}
