import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import AppError from "../errors/AppError.js";
import handlePrismaError from "../errors/handlePrismaError.js";
import handleZodError from "../errors/handleZodError.js";
import sendResponse from "../utils/sendResponse.js";

const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    const { statusCode, message, errors } = handleZodError(error);
    sendResponse(res, {
      success: false,
      statusCode,
      message,
      data: { errors },
    });
    return;
  }

  const bodyParserError =
    error instanceof Error && "type" in error ? error.type : undefined;
  const handled = error instanceof AppError ? error : handlePrismaError(error);
  const response =
    handled ??
    (bodyParserError === "entity.parse.failed"
      ? { statusCode: 400, message: "Malformed request body" }
      : bodyParserError === "entity.too.large"
        ? { statusCode: 413, message: "Request body too large" }
        : { statusCode: 500, message: "Internal server error" });

  if (response.statusCode === 500) {
    console.error(error);
  }

  sendResponse(res, {
    success: false,
    statusCode: response.statusCode,
    message: response.message,
    data: null,
  });
};

export default globalErrorHandler;
