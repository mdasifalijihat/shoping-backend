import type { Request } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as service from "./navbar.service.js";
import type {
  CreateNavbarItem,
  UpdateNavbarItem,
  NavbarOrder,
} from "./navbar.validation.js";

export const create = catchAsync<Request["params"], CreateNavbarItem>(
  async (req, res) => {
    const data = await service.create(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Navbar item created",
      data,
    });
  }
);

export const list = catchAsync(async (_req, res) => {
  const data = await service.list(true);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Navbar items retrieved",
    data,
  });
});

export const listAdmin = catchAsync(async (_req, res) => {
  const data = await service.list(false);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Navbar items retrieved",
    data,
  });
});

export const reorder = catchAsync<Request["params"], NavbarOrder>(
  async (req, res) => {
    const data = await service.reorder(req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Navbar items reordered",
      data,
    });
  }
);

export const update = catchAsync<{ id: string }, UpdateNavbarItem>(
  async (req, res) => {
    const data = await service.update(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Navbar item updated",
      data,
    });
  }
);

export const remove = catchAsync<{ id: string }>(async (req, res) => {
  await service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Navbar item deleted",
    data: null,
  });
});
