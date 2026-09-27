import { describe, expect, it } from 'vitest';

import { hasRequiredPermissions } from '@shared/utils/auth/hasRequiredPermissions';

describe('hasRequiredPermissions', () => {
  it('aceita quando todas as exigidas estão na lista', () => {
    expect(hasRequiredPermissions(['users:read', 'logs:read'], ['users:read', 'logs:read'])).toBe(true);
  });

  it('recusa quando falta uma das exigidas', () => {
    expect(hasRequiredPermissions(['users:read'], ['users:read', 'logs:read'])).toBe(false);
  });

  it('* libera qualquer permissão', () => {
    expect(hasRequiredPermissions(['*'], ['perfis:delete'])).toBe(true);
  });

  it('não existe curinga por grupo', () => {
    expect(hasRequiredPermissions(['users:*'], ['users:read'])).toBe(false);
  });

  it('sem permissão exigida, aceita', () => {
    expect(hasRequiredPermissions([], [])).toBe(true);
  });
});
