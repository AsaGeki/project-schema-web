import { ForbiddenError } from '@shared/errors/UniversalError';
import { hasRequiredPermissions } from '@shared/utils/auth/hasRequiredPermissions';

import type { NextFunction, Request, Response } from 'express';

/**
 * Exige todas as permissões informadas. Vai na rota depois do `verifyToken` e
 * antes de qualquer middleware que grave algo: requisição sem permissão não
 * chega a tocar em arquivo nem em banco.
 */
export function authorize(...permissoes: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!hasRequiredPermissions(req.user.abilities, permissoes)) {
      throw new ForbiddenError({ message: `Você não tem permissão para esta ação. Requer: ${permissoes.join(', ')}.` });
    }

    next();
  };
}
