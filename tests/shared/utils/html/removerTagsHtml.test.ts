import { describe, expect, it } from 'vitest';

import { removerTagsHtml } from '@shared/utils/html/removerTagsHtml';

describe('removerTagsHtml', () => {
  it('tira as tags e junta os espaços', () => {
    expect(removerTagsHtml('<p>Olá,\n  <b>Arthur</b></p><br/>até logo')).toBe('Olá, Arthur até logo');
  });
});
