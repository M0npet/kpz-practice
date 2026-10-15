import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express 4 does not catch rejected promises from async handlers. This wrapper forwards
 * them to next(), so controllers do not repeat try/catch in every method (DRY).
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };
