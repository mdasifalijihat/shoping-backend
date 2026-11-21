import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./attribute.service.js";
import type {
  CreateAttribute,
  UpdateAttribute,
} from "./attribute.validation.js";

export const create = catchAsync<Request["params"], CreateAttribute>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Attribute created",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Attributes retrieved",
    data,
  });
});

export const update = catchAsync<{ id: string }, UpdateAttribute>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Attribute updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Attribute deleted",
    data: null,
  });
});
