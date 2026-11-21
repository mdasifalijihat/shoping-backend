import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./category.service.js";
import type {
  CategoryOrder,
  CategoryQuery,
  CreateCategory,
  UpdateCategory,
} from "./category.validation.js";

export const create = catchAsync<Request["params"], CreateCategory>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Category created",
      data,
    });
  }
);

export const list = catchAsync<Request["params"], unknown, CategoryQuery>(
  async (req, res) => {
    const data = await service.list(req.query.featured === "true");
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Categories retrieved",
      data,
    });
  }
);

export const listAdmin = catchAsync(async (_req, res) => {
  const data = await service.listAdmin();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Categories retrieved",
    data,
  });
});

export const getBySlug = catchAsync<{ slug: string }>(async (req, res) => {
  const data = await service.getBySlug(req.params.slug);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category retrieved",
    data,
  });
});

export const reorder = catchAsync<Request["params"], CategoryOrder>(
  async (req, res) => {
    const data = await service.reorder(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Categories reordered",
      data,
    });
  }
);

export const update = catchAsync<{ id: string }, UpdateCategory>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Category updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Category deleted",
    data: null,
  });
});
