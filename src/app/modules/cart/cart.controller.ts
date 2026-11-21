import type { Request } from "express";
import { requireUser } from "../../middlewares/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./cart.service.js";
import type { CartItemInput } from "./cart.validation.js";

export const get = catchAsync(async (req, res) => {
  const data = await service.get(requireUser(req).id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Cart retrieved",
    data,
  });
});
export const add = catchAsync<Request["params"], CartItemInput>(
  async (req, res) => {
    const data = await service.add(requireUser(req).id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Item added to cart",
      data,
    });
  }
);
export const update = catchAsync<{ itemId: string }, { quantity: number }>(
  async (req, res) => {
    const data = await service.update(
      requireUser(req).id,
      req.params.itemId,
      req.body.quantity
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Cart updated",
      data,
    });
  }
);
export const remove = catchAsync<{ itemId: string }>(async (req, res) => {
  const data = await service.remove(requireUser(req).id, req.params.itemId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Item removed from cart",
    data,
  });
});
export const clear = catchAsync(async (req, res) => {
  const data = await service.clear(requireUser(req).id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Cart cleared",
    data,
  });
});
