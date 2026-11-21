import type { RequestHandler } from "express";
import AppError from "../errors/AppError.js";

const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, "Route not found"));
};

export default notFound;
