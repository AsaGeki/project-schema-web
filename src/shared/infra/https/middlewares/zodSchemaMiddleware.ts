import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Validação do corpo. O resultado é reatribuído para aplicar os transforms do
 * Zod (`trim`, `toLowerCase`).
 */
export const validateSchema = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };
};

/**
 * Validação de query string. No Express 5 `req.query` só tem getter — reatribuir
 * é um no-op silencioso — então o resultado parseado, já com a coerção aplicada,
 * vai em `res.locals.query`, e o controller lê de lá.
 */
export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.query = schema.parse(req.query);
    next();
  };
};
