import type { Response } from "express";

type ResponsePayload<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: Record<string, unknown>;
  data: T;
};

export default function sendResponse<T>(
  res: Response,
  payload: ResponsePayload<T>
): void {
  res.status(payload.statusCode).json(payload);
}
