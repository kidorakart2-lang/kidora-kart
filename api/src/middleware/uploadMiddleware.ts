import multer from "multer";
import path from "path";
import type { Request } from "express";

// Configure multer for memory storage (we'll upload to B2, not disk)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files (JPEG, JPG, PNG, WEBP) are allowed!"),
    );
  }
};

// Multer configuration for different use cases
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB - good for high-quality jewelry images
  },
  fileFilter,
});

// Export different upload configurations
export const uploadAvatar = upload.single("avatar");
export const uploadProduct = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);
export const uploadSingle = upload.single("image");
export const uploadLogo = upload.single("logo");
export const uploadNone = upload.none();