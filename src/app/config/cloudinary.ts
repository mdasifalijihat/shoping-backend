import { v2 as cloudinary } from "cloudinary";
import AppError from "../errors/AppError.js";
import { env } from "./index.js";

const {
  CLOUDINARY_CLOUD_NAME: cloudName,
  CLOUDINARY_API_KEY: apiKey,
  CLOUDINARY_API_SECRET: apiSecret,
} = env;

export function getCloudinary() {
  if (!cloudName || !apiKey || !apiSecret)
    throw new AppError(503, "Media storage is not configured");
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}
