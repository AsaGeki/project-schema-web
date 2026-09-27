import { container } from 'tsyringe';

import PerfisRepository from '@modules/permissoes/infra/prisma/repositories/PerfisRepository';
import type IPerfisRepository from '@modules/permissoes/repositories/IPerfisRepository';
import ResolverPermissoesService from '@modules/permissoes/services/ResolverPermissoesService';
import type IResolvedorDePermissoes from '@shared/infra/auth/IResolvedorDePermissoes';

container.registerSingleton<IPerfisRepository>('PerfisRepository', PerfisRepository);
container.registerSingleton<IResolvedorDePermissoes>('ResolvedorDePermissoes', ResolverPermissoesService);
