import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./paymentMethod.service.js";
import type {
  CreatePaymentMethod,
  UpdatePaymentMethod,
  PaymentMethodOrder,
} from "./paymentMethod.validation.js";

export const create = catchAsync<Request["params"], CreatePaymentMethod>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Payment method created",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list(true);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Payment methods retrieved",
    data,
  });
});

export const listAdmin = catchAsync(async (_req, res) => {
  const data = await service.list(false);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Payment methods retrieved",
    data,
  });
});

export const reorder = catchAsync<Request["params"], PaymentMethodOrder>(
  async (req, res) => {
    const data = await service.reorder(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Payment methods reordered",
      data,
    });
  }
);

export const update = catchAsync<{ id: string }, UpdatePaymentMethod>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Payment method updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Payment method deleted",
    data: null,
  });
});
