import { getCloudinary } from "../../config/cloudinary.js";
import AppError from "../../errors/AppError.js";

type UploadedImage = { url: string; publicId: string };

export function uploadImage(buffer: Buffer): Promise<UploadedImage> {
  const cloudinary = getCloudinary();
  return new Promise((resolve, reject) => {
    const fail = () => reject(new AppError(502, "Image upload failed"));
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          fail();
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.once("error", fail);
    stream.end(buffer);
  });
}

export async function uploadImages(buffers: Buffer[]) {
  const uploaded: UploadedImage[] = [];
  try {
    for (const buffer of buffers) uploaded.push(await uploadImage(buffer));
    return uploaded;
  } catch (error) {
    await Promise.allSettled(
      uploaded.map(({ publicId }) => deleteImage(publicId))
    );
    throw error;
  }
}

export async function deleteImage(publicId: string) {
  const cloudinary = getCloudinary();
  const result = await cloudinary.uploader
    .destroy(publicId, { resource_type: "image", invalidate: true })
    .catch(() => {
      throw new AppError(502, "Image deletion failed");
    });
  if (result?.result === "not found")
    throw new AppError(404, "Image not found");
  if (result?.result !== "ok") throw new AppError(502, "Image deletion failed");
}
