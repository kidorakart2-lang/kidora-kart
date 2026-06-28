import multer from "multer";
import path from "path";
import type { Request } from "express";
import sharp from "sharp";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only — validates extension, mimetype, AND magic bytes (#16)
const fileFilter = async (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): Promise<void> => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (!mimetype || !extname) {
    cb(
      new Error("Only image files (JPEG, JPG, PNG, WEBP) are allowed!"),
    );
    return;
  }

  // #16: Verify magic bytes using sharp's metadata()
  if (file.buffer && file.buffer.length > 0) {
    try {
      const metadata = await sharp(file.buffer).metadata();
      const validFormats = ["jpeg", "png", "webp"];
      if (!metadata.format || !validFormats.includes(metadata.format)) {
        cb(new Error("File content does not match allowed image formats (JPEG, PNG, WEBP)"));
        return;
      }
    } catch {
      cb(new Error("Invalid or corrupted image file"));
      return;
    }
  }

  cb(null, true);
};

// Multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file (reduced from 10MB)
    files: 10, // max 10 files total per request
  },
  fileFilter,
});

// Export different upload configurations
export const uploadAvatar = upload.single("avatar");
export const uploadProduct = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 9 }, // reduced from 10 to respect total files limit
]);
export const uploadSingle = upload.single("image");
export const uploadLogo = upload.single("logo");
export const uploadNone = upload.none();
