import type { UniversalError } from '@shared/errors/UniversalError';
import { BadRequestError, ConflictError, NotFoundError, UnprocessableEntityError } from '@shared/errors/UniversalError';

/**
 * Erros conhecidos do Prisma chegam com `code` no formato `P####`. O client não
 * é importado aqui de propósito: identificar pela forma do erro evita acoplar o
 * tratamento a uma versão do `@prisma/client`.
 */
interface IPrismaKnownError {
  code: string;
  meta?: { target?: string[] | string; cause?: string; field_name?: string };
  message: string;
}

export function isPrismaError(error: unknown): error is IPrismaKnownError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as IPrismaKnownError).code === 'string' &&
    /^P\d{4}$/.test((error as IPrismaKnownError).code)
  );
}

function targetToText(target?: string[] | string): string {
  if (!target) return 'informado';
  return Array.isArray(target) ? target.join(', ') : target;
}

export function mapPrismaError(error: IPrismaKnownError): UniversalError {
  switch (error.code) {
    case 'P2002':
      return new ConflictError({
        message: `Já existe um registro com o mesmo ${targetToText(error.meta?.target)}.`,
        code: error.code,
      });
    case 'P2003':
      return new UnprocessableEntityError({
        message: 'Referência inválida: o registro relacionado não existe.',
        code: error.code,
      });
    case 'P2011':
      return new UnprocessableEntityError({
        message: `O campo ${targetToText(error.meta?.target)} não pode ser nulo.`,
        code: error.code,
      });
    case 'P2014':
      return new ConflictError({
        message: 'A operação violaria uma relação obrigatória entre registros.',
        code: error.code,
      });
    case 'P2025':
      return new NotFoundError({
        message: 'O registro não foi encontrado.',
        code: error.code,
      });
    default:
      return new BadRequestError({
        message: 'Não foi possível concluir a operação no banco de dados.',
        code: error.code,
      });
  }
}
