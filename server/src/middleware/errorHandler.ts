import { Request, Response, NextFunction } from 'express';

import { CustomError } from '../utils/response/custom-error/CustomError';

type HttpLikeError = Error & { status?: number; statusCode?: number; type?: string };

// Express recognises an error middleware by its 4 arguments, so `next` must stay.
export const errorHandler = (err: CustomError | HttpLikeError, req: Request, res: Response, next: NextFunction) => {
  // Not every error is a CustomError: body-parser throws a SyntaxError for malformed JSON,
  // other libraries throw plain Errors. Before this check such errors had no HttpStatusCode,
  // `res.status(undefined)` threw a RangeError and the client got an HTML 500 page.
  const customError =
    err instanceof CustomError
      ? err
      : new CustomError(
          (err as HttpLikeError).status ?? (err as HttpLikeError).statusCode ?? 500,
          'General',
          (err as HttpLikeError).type === 'entity.parse.failed'
            ? 'Invalid JSON in request body'
            : 'Internal Server Error',
          [err.message],
        );

  const body = customError.JSON;
  // Stack traces are useful while developing but must not leak outside of it.
  if (process.env.NODE_ENV !== 'dev') {
    delete body.stack;
  }
  return res.status(customError.HttpStatusCode).json(body);
};
