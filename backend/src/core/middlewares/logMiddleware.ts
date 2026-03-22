import { logger } from '@core/utils/logger';
import { NextFunction, Request, Response } from 'express';

const log = logger.child({ prefix: 'http' });

export function logMiddleware(req: Request, res: Response, next: NextFunction): void {
	const start = Date.now();

	res.on('finish', () => {
		const duration = Date.now() - start;
		const { method, originalUrl } = req;
		const { statusCode } = res;

		const message = `${method} ${originalUrl} ${statusCode} — ${duration}ms`;

		if (statusCode >= 500) {
			log.error(message);
		} else if (statusCode >= 400) {
			log.warn(message);
		} else {
			log.info(message);
		}
	});

	next();
}
