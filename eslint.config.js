const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importXPlugin = require('eslint-plugin-import-x');
const nPlugin = require('eslint-plugin-n');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },

  js.configs.recommended,

  // Arquivos CommonJS puros de configuração, sem alias de path.
  {
    files: ['*.js', '*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    plugins: { n: nPlugin },
    rules: {
      ...nPlugin.configs['flat/recommended-script'].rules,
      'n/no-unpublished-require': 'off',
    },
  },

  {
    files: ['**/*.ts', '**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
      parser: tsParser,
      parserOptions: {
        // Descobre o tsconfig mais próximo de cada arquivo sozinho, o que liga o
        // lint com informação de tipo (no-floating-promises, no-misused-promises).
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import-x': importXPlugin,
      n: nPlugin,
    },
    settings: {
      ...importXPlugin.configs['flat/typescript'].settings,
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...nPlugin.configs['flat/recommended-module'].rules,
      ...importXPlugin.configs['flat/recommended'].rules,
      ...importXPlugin.configs['flat/typescript'].rules,
      ...prettierConfig.rules,

      // Resolução de path alias fica com o import-x; o `tsc --noEmit` já cobre.
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'import-x/no-named-as-default-member': 'off',

      'no-undef': 'off',
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],

      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], custom: { regex: '^I[A-Z]', match: true } },
        { selector: 'typeAlias', format: ['PascalCase'], custom: { regex: '^T[A-Z]', match: true } },
        { selector: 'enum', format: ['PascalCase'], custom: { regex: '^E[A-Z]', match: true } },
      ],

      // Ordem de import, corrigível com `--fix`.
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [{ pattern: '{@configs,@shared,@modules}/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
