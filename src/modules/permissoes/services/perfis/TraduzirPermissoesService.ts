import { inject, injectable } from 'tsyringe';

import { PERMISSOES_DO_CATALOGO } from '@modules/permissoes/catalogoPermissoes';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import { InternalServerError, UnprocessableEntityError } from '@shared/errors/UniversalError';

/**
 * Service interno do create e do update de perfil: confere as permissões contra
 * o catálogo do código e devolve os ids do banco, sem envelope.
 */
@injectable()
export default class TraduzirPermissoesService {
  constructor(
    @inject('PerfisRepository')
    private readonly repository: IPerfisRepository,
  ) {}

  public async execute(chaves: string[]): Promise<string[]> {
    const unicas = [...new Set(chaves)];
    const inexistentes = unicas.filter(chave => !PERMISSOES_DO_CATALOGO.has(chave));

    if (inexistentes.length > 0) {
      throw new UnprocessableEntityError({
        message: `Permissões que não existem: ${inexistentes.join(', ')}.`,
        code: 'PERMISSAO_INEXISTENTE',
        details: inexistentes,
      });
    }

    const ids = await this.repository.idsDasPermissoes(unicas);

    // Está no catálogo do código e não no banco: o seed não rodou depois da mudança.
    if (ids.length !== unicas.length) {
      throw new InternalServerError({
        message: 'O catálogo de permissões do banco está desatualizado. Rode pnpm db:seed.',
        code: 'CATALOGO_DESATUALIZADO',
      });
    }

    return ids;
  }
}
