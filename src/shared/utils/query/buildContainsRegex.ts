import { escapeRegex } from '@shared/utils/query/escapeRegex';

/** Regex de busca por substring, case-insensitive, com o termo já escapado. */
export function buildContainsRegex(value: string): RegExp {
  return new RegExp(escapeRegex(value), 'i');
}
