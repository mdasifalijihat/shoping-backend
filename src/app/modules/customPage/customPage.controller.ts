import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./customPage.service.js";
import type { CreatePage, UpdatePage } from "./customPage.validation.js";

export const create = catchAsync<Request["params"], CreatePage>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Page created",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Pages retrieved",
    data,
  });
});

export const getBySlug = catchAsync<{ slug: string }>(async (req, res) => {
  const data = await service.getBySlug(req.params.slug);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Page retrieved",
    data,
  });
});

export const update = catchAsync<{ id: string }, UpdatePage>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Page updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Page deleted",
    data: null,
  });
});
