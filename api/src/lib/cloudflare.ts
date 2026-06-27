import crypto from "crypto";
import path from "path";
import sharp from "sharp";
import {
  s3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "../config/cloudflare.config.js";
import { env } from "../config/env.js";

interface MulterFile {
  buffer: Buffer;
  originalname: string;
}

interface UploadResult {
  success: boolean;
  url: string;
  fileName: string;
}

/**
 * Generate a unique filename with folder structure
 */
const generateFileName = (
  originalName: string,
  folder = "",
): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalName).toLowerCase();
  const name = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
  return `${
    folder ? `${folder}/` : ""
  }${name}-${randomString}-${timestamp}${ext}`;
};

/**
 * Optimize image using Sharp
 */
const optimizeImage = async (
  buffer: Buffer,
  options: { quality?: number } = {},
): Promise<Buffer> => {
  return await sharp(buffer)
    .resize({
      width: 1200,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFormat("webp", {
      quality: options.quality ?? 75,
      effort: 6,
    })
    .toBuffer();
};

/**
 * Upload file to Cloudflare R2
 */
export const uploadToR2 = async (
  file: MulterFile,
  folder = "users",
  quality = 80,
): Promise<UploadResult> => {
  try {
    let fileBuffer: Buffer;
    if (folder === "banner") {
      fileBuffer = await optimizeImage(file.buffer, { quality: 85 });
    } else if (folder === "products") {
      fileBuffer = await optimizeImage(file.buffer, {
        quality: quality || 80,
      });
    } else {
      fileBuffer = await optimizeImage(file.buffer, { quality: 80 });
    }

    let fileName = generateFileName(file.originalname, folder);
    const contentType = "image/webp";

    fileName = fileName.replace(path.extname(fileName), ".webp");

    const command = new PutObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
      ACL: "public-read",
    });

    await s3Client.send(command);

    const fileUrl = `https://cdn.jewellerywalla.com/${fileName}`;

    return {
      success: true,
      url: fileUrl,
      fileName,
    };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    throw new Error("Failed to upload file to Cloudflare R2");
  }
};

/**
 * Delete file from Cloudflare R2
 */
export const deleteFromR2 = async (
  fileName: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.CLOUDFLARE_BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    console.error("R2 Delete Error:", error);
    throw new Error("Failed to delete file from Cloudflare R2");
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleToR2 = async (
  files: MulterFile[],
  folder = "products",
): Promise<UploadResult[]> => {
  try {
    const uploadPromises = files.map((file) => uploadToR2(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("R2 Multiple Upload Error:", error);
    throw new Error("Failed to upload files to Cloudflare R2");
  }
};