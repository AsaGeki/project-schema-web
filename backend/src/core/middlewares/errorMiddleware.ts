import { AppError } from '@core/errors/AppError';
import { logger } from '@core/utils/logger';
import { ErrorRequestHandler } from 'express';

const log = logger.child({ prefix: 'error' });

export const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	const requestContext = {
		method: req.method,
		path: req.originalUrl,
		statusCode: error instanceof AppError ? error.statusCode : 500
	};

	if (error instanceof AppError) {
		log.warn(error.message, {
			...requestContext,
			originFile: error.originFile,
			title: error.title,
			details: error.details
		});

		return res.status(error.statusCode).json({
			success: false,
			title: error.title ?? 'Erro na requisição',
			message: error.message,
			details: error.details ?? null
		});
	}

	log.error('Erro interno do servidor.', {
		...requestContext,
		error
	});

	return res.status(500).json({
		success: false,
		title: 'Erro interno do servidor',
		message: 'Ocorreu um erro interno.'
	});
};
