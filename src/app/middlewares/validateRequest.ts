import type { Request } from "express";
import type { z } from "zod";
import catchAsync from "../utils/catchAsync.js";

export default function validateRequest(schema: z.ZodObject) {
  return catchAsync<Request["params"], unknown, unknown>(
    async (req, _res, next) => {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if ("body" in parsed) req.body = parsed.body;
      if ("params" in parsed) {
        Object.defineProperty(req, "params", {
          value: parsed.params,
          writable: true,
          configurable: true,
        });
      }
      if ("query" in parsed) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          configurable: true,
        });
      }

      next();
    }
  );
}
