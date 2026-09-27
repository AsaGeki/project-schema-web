import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';

/** Variável disponível no template, como o editor do front a mostra. */
export interface ITokenEmail {
  nome: string;
  tipo: string;
  exemplo: string;
}

export interface IFlagEmail {
  titulo: string;
  tokens: ITokenEmail[];
}

/** Para cada flag, o título e as variáveis que o resolver entrega ao Handlebars. */
export const CATALOGO_FLAGS: Record<EFlagEmail, IFlagEmail> = {
  [EFlagEmail.USUARIO_CRIADO]: {
    titulo: 'Usuário criado',
    tokens: [
      { nome: 'usuario.nome', tipo: 'string', exemplo: 'Arthur Gabriel' },
      { nome: 'usuario.email', tipo: 'string', exemplo: 'arthur@exemplo.com' },
    ],
  },
};
