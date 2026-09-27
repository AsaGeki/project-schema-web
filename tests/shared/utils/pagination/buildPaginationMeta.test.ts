import { describe, expect, it } from 'vitest';

import { buildPaginationMeta } from '@shared/utils/pagination/buildPaginationMeta';

describe('buildPaginationMeta', () => {
  it('calcula total de páginas e indica que há próxima página', () => {
    expect(buildPaginationMeta(2, 20, 47)).toEqual({ page: 2, limit: 20, total: 47, totalPages: 3, hasNext: true });
  });

  it('não indica próxima página na última página', () => {
    expect(buildPaginationMeta(3, 20, 47)).toMatchObject({ totalPages: 3, hasNext: false });
  });

  it('coleção vazia dá zero páginas e nenhuma próxima', () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false });
  });

  it('página além do total não indica próxima', () => {
    expect(buildPaginationMeta(999, 10, 5)).toMatchObject({ page: 999, totalPages: 1, hasNext: false });
  });
});
