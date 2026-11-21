import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./homepageSection.service.js";
import type {
  CreateSection,
  UpdateSection,
  SectionOrder,
} from "./homepageSection.validation.js";

export const create = catchAsync<Request["params"], CreateSection>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Homepage section created",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list(true);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Homepage sections retrieved",
    data,
  });
});

export const listAdmin = catchAsync(async (_req, res) => {
  const data = await service.list(false);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Homepage sections retrieved",
    data,
  });
});

export const reorder = catchAsync<Request["params"], SectionOrder>(
  async (req, res) => {
    const data = await service.reorder(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Homepage sections reordered",
      data,
    });
  }
);

export const update = catchAsync<{ id: string }, UpdateSection>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Homepage section updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Homepage section deleted",
    data: null,
  });
});
