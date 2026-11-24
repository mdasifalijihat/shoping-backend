import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./product.service.js";
import type {
  AdminProductQuery,
  CreateProduct,
  ProductQuery,
  UpdateProduct,
} from "./product.validation.js";

export const create = catchAsync<Request["params"], CreateProduct>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Product created",
      data,
    });
  }
);

export const list = catchAsync<Request["params"], unknown, ProductQuery>(
  async (req, res) => {
    const { data, meta } = await service.list(req.query);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Products retrieved",
      meta,
      data,
    });
  }
);

export const listAdmin = catchAsync<
  Request["params"],
  unknown,
  AdminProductQuery
>(async (req, res) => {
  const { data, meta } = await service.listAdmin(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Products retrieved",
    meta,
    data,
  });
});

export const getAdminById = catchAsync<{ id: string }>(async (req, res) => {
  const data = await service.getAdminById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product retrieved",
    data,
  });
});

export const getBySlug = catchAsync<{ slug: string }>(async (req, res) => {
  const data = await service.getBySlug(req.params.slug);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Product retrieved",
    data,
  });
});

export const update = catchAsync<{ id: string }, UpdateProduct>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Product updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  const { deactivated } = await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: deactivated ? "Product deactivated" : "Product deleted",
    data: null,
  });
});
