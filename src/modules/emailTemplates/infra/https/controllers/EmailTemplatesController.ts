import { container } from 'tsyringe';

import type {
  IEmailEnvio,
  IEmailTemplateAlternancia,
  IEmailTemplatePublicacao,
} from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import AlternarService from '@modules/emailTemplates/services/AlternarService';
import FindAllService from '@modules/emailTemplates/services/FindAllService';
import FindByFlagService from '@modules/emailTemplates/services/FindByFlagService';
import PublishService from '@modules/emailTemplates/services/PublishService';
import SendService from '@modules/emailTemplates/services/SendService';
import { sendResponse } from '@shared/infra/https/sendResponse';

import type { Request, Response } from 'express';

export default class EmailTemplatesController {
  public async findAll(this: void, _req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindAllService);
    const result = await service.execute();
    return sendResponse(res, result);
  }

  public async findByFlag(this: void, req: Request<{ flag: string }>, res: Response): Promise<Response> {
    const service = container.resolve(FindByFlagService);
    const result = await service.execute(req.params.flag);
    return sendResponse(res, result);
  }

  public async publish(
    this: void,
    req: Request<{ flag: string }, unknown, IEmailTemplatePublicacao>,
    res: Response,
  ): Promise<Response> {
    const service = container.resolve(PublishService);
    const result = await service.execute(req.params.flag, req.body, req.user.id);
    return sendResponse(res, result);
  }

  public async alternar(
    this: void,
    req: Request<{ flag: string }, unknown, IEmailTemplateAlternancia>,
    res: Response,
  ): Promise<Response> {
    const service = container.resolve(AlternarService);
    const result = await service.execute(req.params.flag, req.body.isActive, req.user.id);
    return sendResponse(res, result);
  }

  public async send(
    this: void,
    req: Request<{ flag: string }, unknown, IEmailEnvio>,
    res: Response,
  ): Promise<Response> {
    const service = container.resolve(SendService);
    const result = await service.execute(req.params.flag, req.body, req.user.id);
    return sendResponse(res, result);
  }
}
