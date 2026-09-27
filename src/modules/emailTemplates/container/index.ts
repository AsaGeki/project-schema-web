import { container } from 'tsyringe';

import EmailTemplatesRepository from '@modules/emailTemplates/infra/mongo/repositories/EmailTemplatesRepository';
import type IEmailTemplatesRepository from '@modules/emailTemplates/repositories/IEmailTemplatesRepository';

container.registerSingleton<IEmailTemplatesRepository>('EmailTemplatesRepository', EmailTemplatesRepository);
