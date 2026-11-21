import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./coupon.service.js";
import type {
  CreateCoupon,
  UpdateCoupon,
  ApplyCoupon,
} from "./coupon.validation.js";

export const create = catchAsync<Request["params"], CreateCoupon>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Coupon created",
      data,
    });
  }
);

export const listAdmin = catchAsync(async (_req, res) => {
  const data = await service.listAdmin();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupons retrieved",
    data,
  });
});

export const apply = catchAsync<Request["params"], ApplyCoupon>(
  async (req, res) => {
    const data = await service.apply(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Coupon applied",
      data,
    });
  }
);

export const update = catchAsync<{ id: string }, UpdateCoupon>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Coupon updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Coupon deleted",
    data: null,
  });
});
