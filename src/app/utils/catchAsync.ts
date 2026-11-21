import type { NextFunction, Request, RequestHandler, Response } from "express";

export default function catchAsync<
  Params = Request["params"],
  Body = unknown,
  Query = Request["query"],
>(
  handler: (
    req: Request<Params, unknown, Body, Query>,
    res: Response,
    next: NextFunction
  ) => Promise<unknown>
): RequestHandler<Params, unknown, Body, Query> {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}
