import type { RequestHandler } from "express";
import multer from "multer";
import AppError from "../errors/AppError.js";

const maxFileSize = 5 * 1024 * 1024;
const signatures = new Map<string, (buffer: Buffer) => boolean>([
  [
    "image/jpeg",
    (buffer) => buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
  ],
  [
    "image/png",
    (buffer) =>
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  ],
  [
    "image/gif",
    (buffer) => ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)),
  ],
  [
    "image/webp",
    (buffer) =>
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  ],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize + 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (!signatures.has(file.mimetype)) {
      callback(
        new AppError(415, "Only JPEG, PNG, WebP, and GIF images are accepted")
      );
      return;
    }
    callback(null, true);
  },
});

function parseImages(parser: RequestHandler, field: string): RequestHandler {
  return (req, res, next) => {
    if (!req.is("multipart/form-data")) {
      next(new AppError(415, "Use multipart/form-data to upload images"));
      return;
    }
    parser(req, res, (error?: unknown) => {
      if (error instanceof AppError) return next(error);
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return next(new AppError(413, "Each image must be 5 MB or smaller"));
      }
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return next(
          new AppError(
            400,
            `Unexpected file field or too many files. Use the "${field}" field`
          )
        );
      }
      if (error)
        return next(new AppError(400, "Invalid multipart image upload"));

      const files = req.file
        ? [req.file]
        : Array.isArray(req.files)
          ? req.files
          : [];
      if (!files.length)
        return next(
          new AppError(400, `Provide an image in the "${field}" field`)
        );
      for (const file of files) {
        if (file.size > maxFileSize)
          return next(new AppError(413, "Each image must be 5 MB or smaller"));
        if (!signatures.get(file.mimetype)?.(file.buffer)) {
          return next(
            new AppError(
              415,
              "The image contents do not match its declared format"
            )
          );
        }
      }
      next();
    });
  };
}

export const uploadSingle = parseImages(upload.single("file"), "file");
export const uploadMultiple = parseImages(upload.array("files", 10), "files");
