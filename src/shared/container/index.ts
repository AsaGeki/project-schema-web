import { container } from 'tsyringe';

import { EMailProvider, env } from '@configs/envConfig';
import '@modules/arquivos/container';
import '@modules/logs/container';
import '@modules/permissoes/container';
import '@modules/users/container';
import GraphMailer from '@shared/infra/mail/GraphMailer';
import type IMailer from '@shared/infra/mail/IMailer';
import SmtpMailer from '@shared/infra/mail/SmtpMailer';
import type IFileStorage from '@shared/infra/storage/IFileStorage';
import LocalDiskStorage from '@shared/infra/storage/LocalDiskStorage';
import HashService from '@shared/services/HashService';

container.registerSingleton<HashService>('HashService', HashService);
container.registerSingleton<IFileStorage>('FileStorage', LocalDiskStorage);
container.registerSingleton<IMailer>(
  'Mailer',
  env.mail.MAIL_PROVIDER === EMailProvider.GRAPH ? GraphMailer : SmtpMailer,
);

export { container };
