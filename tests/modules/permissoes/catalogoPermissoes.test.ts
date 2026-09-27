import { describe, expect, it } from 'vitest';

import { CATALOGO_PERMISSOES, grupoDoCatalogo, PERMISSOES_DO_CATALOGO } from '@modules/permissoes/catalogoPermissoes';

describe('catálogo de permissões', () => {
  it('reúne as permissões de todos os módulos no formato grupo:acao', () => {
    expect([...PERMISSOES_DO_CATALOGO].sort()).toEqual([
      'logs:read',
      'perfis:assign',
      'perfis:create',
      'perfis:delete',
      'perfis:read',
      'perfis:update',
      'users:delete',
      'users:read',
      'users:update',
    ]);
  });

  it('não repete slug de grupo', () => {
    const slugs = CATALOGO_PERMISSOES.map(grupo => grupo.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('recusa enum com valor fora do prefixo do grupo', () => {
    expect(() => grupoDoCatalogo('users', 'Usuários', { READ: 'user:read' })).toThrow('user:read');
  });
});
