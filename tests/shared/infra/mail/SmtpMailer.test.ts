import nodemailer from 'nodemailer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServiceUnavailableError } from '@shared/errors/UniversalError';
import SmtpMailer from '@shared/infra/mail/SmtpMailer';

const enviarPeloTransporte = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTestAccount: vi.fn(() => Promise.resolve({ user: 'teste@ethereal.email', pass: 'senha' })),
    createTransport: vi.fn(() => ({ sendMail: enviarPeloTransporte })),
    getTestMessageUrl: vi.fn(() => 'https://ethereal.email/message/1'),
  },
}));

const mensagem = { to: ['a@exemplo.com'], cc: ['b@exemplo.com'], subject: 'Assunto', html: '<p>Oi</p>', text: 'Oi' };

describe('SmtpMailer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enviarPeloTransporte.mockResolvedValue({ messageId: '1' });
  });

  it('fora de produção e sem SMTP_HOST, envia por uma conta de teste do Ethereal', async () => {
    await new SmtpMailer().enviar(mensagem);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.ethereal.email', auth: { user: 'teste@ethereal.email', pass: 'senha' } }),
    );
    expect(enviarPeloTransporte).toHaveBeenCalledWith({ ...mensagem, from: '"Project Schema" <no-reply@exemplo.com>' });
  });

  it('cria o transporte uma vez só', async () => {
    const mailer = new SmtpMailer();

    await mailer.enviar(mensagem);
    await mailer.enviar(mensagem);

    expect(nodemailer.createTransport).toHaveBeenCalledOnce();
  });

  it('falha do transporte vira 503 EMAIL_INDISPONIVEL', async () => {
    enviarPeloTransporte.mockRejectedValue(new Error('ECONNREFUSED'));

    const erro = await new SmtpMailer().enviar(mensagem).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ServiceUnavailableError);
    expect(erro).toMatchObject({ code: 'EMAIL_INDISPONIVEL' });
  });
});
