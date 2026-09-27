import { EPermissaoLogs } from '@modules/logs/EPermissaoLogs';
import { EPermissaoPerfis } from '@modules/permissoes/EPermissaoPerfis';
import { EPermissaoUsers } from '@modules/users/EPermissaoUsers';

export interface IGrupoDoCatalogo {
  slug: string;
  /** Nome legível do grupo, para a tela de montagem de perfil. */
  nome: string;
  acoes: string[];
}

/**
 * Grupo a partir do enum de um módulo. Valor fora do prefixo `slug:` derruba o
 * processo no import: a rota conferiria uma permissão que nenhum perfil tem.
 */
export function grupoDoCatalogo(slug: string, nome: string, permissoes: Record<string, string>): IGrupoDoCatalogo {
  const acoes = Object.values(permissoes).map(permissao => {
    if (!permissao.startsWith(`${slug}:`)) {
      throw new Error(`Permissão "${permissao}" fora do grupo "${slug}".`);
    }

    return permissao.slice(slug.length + 1);
  });

  return { slug, nome, acoes };
}

/** Toda permissão que alguma rota confere. É o que o seed sincroniza com o banco. */
export const CATALOGO_PERMISSOES: readonly IGrupoDoCatalogo[] = [
  grupoDoCatalogo('users', 'Usuários', EPermissaoUsers),
  grupoDoCatalogo('logs', 'Logs', EPermissaoLogs),
  grupoDoCatalogo('perfis', 'Perfis de acesso', EPermissaoPerfis),
];

/** As permissões do catálogo no formato `grupo:acao`. */
export const PERMISSOES_DO_CATALOGO: ReadonlySet<string> = new Set(
  CATALOGO_PERMISSOES.flatMap(grupo => grupo.acoes.map(acao => `${grupo.slug}:${acao}`)),
);
