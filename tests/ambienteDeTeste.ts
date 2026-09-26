import fs from 'fs';
import path from 'path';

/** Segredos só dos testes: nenhum teste depende do `.env` para o `envConfig` validar. */
export const SEGREDOS_DE_TESTE = {
  JWT_SECRET: 'segredo-de-teste',
  JWT_REFRESH_SECRET: 'segredo-refresh-de-teste',
};

/**
 * Lê uma variável do `.env` da raiz sem aplicar no `process.env`; o ambiente do
 * processo tem precedência. Lê linhas `CHAVE=valor` sem aspas, como o `.env.example`.
 */
export function lerVariavel(nome: string): string | undefined {
  if (process.env[nome]) return process.env[nome];

  const arquivo = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(arquivo)) return undefined;

  const linha = fs
    .readFileSync(arquivo, 'utf8')
    .split(/\r?\n/)
    .find(texto => texto.startsWith(`${nome}=`));

  return linha?.slice(nome.length + 1).trim() || undefined;
}

function nomeDoBanco(url: string): string {
  return new URL(url).pathname.replace(/^\//, '');
}

/**
 * URLs dos bancos da integração, conferidas antes de qualquer escrita: o global
 * setup zera o Postgres e remove o Mongo apontados aqui. Recusa URL ausente,
 * igual à de desenvolvimento, ou de banco cujo nome não termina em `_test`.
 */
export function urlsDeTeste(): { databaseUrl: string; mongoUri: string } {
  const databaseUrl = lerVariavel('DATABASE_URL_TEST');
  const mongoUri = lerVariavel('MONGODB_URI_TEST');

  if (!databaseUrl || !mongoUri) {
    throw new Error(
      'A integração exige DATABASE_URL_TEST e MONGODB_URI_TEST, cada uma apontando para um banco exclusivo de teste.',
    );
  }

  const urlsDeDesenvolvimento = [
    lerVariavel('DATABASE_URL'),
    lerVariavel('MONGODB_URI_DEV'),
    lerVariavel('MONGODB_URI'),
  ];

  for (const url of [databaseUrl, mongoUri]) {
    if (urlsDeDesenvolvimento.includes(url)) {
      throw new Error(`A URL de teste é a mesma de um banco de desenvolvimento: ${nomeDoBanco(url)}.`);
    }

    if (!nomeDoBanco(url).endsWith('_test')) {
      throw new Error(`O banco de teste precisa terminar em "_test" (recebido: "${nomeDoBanco(url)}").`);
    }
  }

  return { databaseUrl, mongoUri };
}
