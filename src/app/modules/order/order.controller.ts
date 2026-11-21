import type { Request } from "express";
import { isAdmin, requireUser } from "../../middlewares/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import type { Pagination } from "../../utils/pagination.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./order.service.js";
import type {
  AdminOrderQuery,
  CreateOrder,
  OrderStatusUpdate,
} from "./order.validation.js";

export const create = catchAsync<Request["params"], CreateOrder>(
  async (req, res) => {
    const data = await service.create(req.user?.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Order placed",
      data,
    });
  }
);
export const history = catchAsync<Request["params"], unknown, Pagination>(
  async (req, res) => {
    const { data, meta } = await service.history(
      requireUser(req).id,
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Order history retrieved",
      data,
      meta,
    });
  }
);
export const listAdmin = catchAsync<
  Request["params"],
  unknown,
  AdminOrderQuery
>(async (req, res) => {
  const { data, meta } = await service.listAdmin(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Orders retrieved",
    data,
    meta,
  });
});
export const track = catchAsync<
  { orderNumber: string },
  unknown,
  { customerPhone: string }
>(async (req, res) => {
  const data = await service.track(
    req.params.orderNumber,
    req.query.customerPhone
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order status retrieved",
    data,
  });
});
export const get = catchAsync<{ id: string }>(async (req, res) => {
  const user = requireUser(req);
  const data = await service.get(req.params.id, user.id, isAdmin(user.role));
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Order retrieved",
    data,
  });
});
export const updateStatus = catchAsync<{ id: string }, OrderStatusUpdate>(
  async (req, res) => {
    const data = await service.updateStatus(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Order status updated",
      data,
    });
  }
);
