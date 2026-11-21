import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./shippingZone.service.js";
import type {
  CreateShippingZone,
  UpdateShippingZone,
  ShippingZoneOrder,
} from "./shippingZone.validation.js";

export const create = catchAsync<Request["params"], CreateShippingZone>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Shipping zone created",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list(true);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Shipping zones retrieved",
    data,
  });
});

export const listAdmin = catchAsync(async (_req, res) => {
  const data = await service.list(false);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Shipping zones retrieved",
    data,
  });
});

export const reorder = catchAsync<Request["params"], ShippingZoneOrder>(
  async (req, res) => {
    const data = await service.reorder(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Shipping zones reordered",
      data,
    });
  }
);

export const update = catchAsync<{ id: string }, UpdateShippingZone>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Shipping zone updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Shipping zone deleted",
    data: null,
  });
});
