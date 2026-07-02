import express, { raw } from "express";
import mongoose from "mongoose";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import "dotenv/config";
import { env } from "./config/env.js";

import userRoutes from "./routes/web/user.route.js";
import productRoutes from "./routes/web/product.routes.js";
import cartRoutes from "./routes/web/cart.routes.js";
import wishlistRoutes from "./routes/web/wishlist.routes.js";
import navRoutes from "./routes/web/nav.routes.js";
import faqRoutes from "./routes/web/faq.routes.js";
import testimonialRoutes from "./routes/web/testimonial.routes.js";
import logoRoutes from "./routes/web/logo.routes.js";
import bannerRoutes from "./routes/web/banner.routes.js";
import reviewRoutes from "./routes/web/review.routes.js";
import whyChooseUsRoutes from "./routes/web/whyChooseUs.routes.js";
import webColorRoutes from "./routes/web/color.routes.js";
import webMaterialRoutes from "./routes/web/material.routes.js";
import orderRoutes from "./routes/web/order.routes.js";
import contactRoutes from "./routes/web/contact.routes.js";
import suggestionRoutes from "./routes/web/suggestion.routes.js";
import coupenRoutes from "./routes/web/coupen.routes.js";
import productFaqRoutes from "./routes/web/productFaq.routes.js";
import homePageRoutes from "./routes/web/homePage.routes.js";
import materialRoutes from "./routes/admin/material.routes.js";
import sizeRoutes from "./routes/admin/size.routes.js";
import colorRoutes from "./routes/admin/color.routes.js";
import userAdminRoutes from "./routes/admin/userAdmin.routes.js";
import adminCategoryRoutes from "./routes/admin/adminCategory.routes.js";
import adminSubCategoryRoutes from "./routes/admin/adminSubCat.routes.js";
import adminSubSubCategoryRoutes from "./routes/admin/adminSubSubCat.routes.js";
import adminFaqRoutes from "./routes/admin/adminFaq.routes.js";
import adminBannerRoutes from "./routes/admin/adminBanner.routes.js";
import adminTestimonialRoutes from "./routes/admin/adminTestimonial.routes.js";
import adminLogoRoutes from "./routes/admin/adminLogo.routes.js";
import adminProductRoutes from "./routes/admin/adminProduct.routes.js";
import adminReviewRoutes from "./routes/admin/adminReview.routes.js";
import adminWhyChooseUsRoutes from "./routes/admin/adminWhyChooseUs.routes.js";
import dashboardRoutes from "./routes/admin/dashboard.routes.js";
import adminOrderRoutes from "./routes/admin/adminOrder.routes.js";
import adminBannerLinkOptionsRoutes from "./routes/admin/adminBannerLinkOptions.routes.js";
import adminProductFaqRoutes from "./routes/admin/adminProductFaq.routes.js";
import homePageAdminRoutes from "./routes/admin/homePage.routes.js";
import auditLogRoutes from "./routes/admin/auditLog.routes.js";
import { getCsrfToken } from "./controller/csrf.controller.js";

const app = express();

app.use(helmet());

app.use(compression());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    credentials: true,
  }),
);

app.use(cookieParser());

function sanitize(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
    const k = key.replace(/^\$/, "").replace(/\./g, "");
    (acc as Record<string, unknown>)[k] = sanitize((obj as Record<string, unknown>)[key]);
    return acc;
  }, {} as Record<string, unknown>);
}

app.use((req, _res, next) => {
  if (req.body) req.body = sanitize(req.body) as typeof req.body;
  const q = sanitize({ ...req.query });
  try { Object.defineProperty(req, "query", { value: q, configurable: true }); } catch {}
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === "/api/website/orders/webhooks/razorpay") {
    raw({ type: "application/json" })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use("/api/website/logo", logoRoutes);
app.use("/api/website/banner", bannerRoutes);
app.use("/api/website/nav", navRoutes);
app.use("/api/website/user", userRoutes);
app.use("/api/website/product", productRoutes);
app.use("/api/website/cart", cartRoutes);
app.use("/api/website/wishlist", wishlistRoutes);
app.use("/api/website/faq", faqRoutes);
app.use("/api/website/testimonial", testimonialRoutes);
app.use("/api/website/whyChooseUs", whyChooseUsRoutes);
app.use("/api/website/review", reviewRoutes);
app.use("/api/website/color", webColorRoutes);
app.use("/api/website/material", webMaterialRoutes);
app.use("/api/website/orders", orderRoutes);
app.use("/api/website/contact", contactRoutes);
app.use("/api/website/result", suggestionRoutes);
app.use("/api/website/coupen", coupenRoutes);
app.use("/api/website/product-faq", productFaqRoutes);
app.use("/api/website/home-page", homePageRoutes);

app.use("/api/admin/logo", adminLogoRoutes);
app.use("/api/admin/banner", adminBannerRoutes);
app.use("/api/admin/user", userAdminRoutes);
app.use("/api/admin/category", adminCategoryRoutes);
app.use("/api/admin/subcategory", adminSubCategoryRoutes);
app.use("/api/admin/subsubcategory", adminSubSubCategoryRoutes);
app.use("/api/admin/product", adminProductRoutes);
app.use("/api/admin/color", colorRoutes);
app.use("/api/admin/material", materialRoutes);
app.use("/api/admin/size", sizeRoutes);
app.use("/api/admin/faq", adminFaqRoutes);
app.use("/api/admin/testimonial", adminTestimonialRoutes);
app.use("/api/admin/review", adminReviewRoutes);
app.use("/api/admin/whyChooseUs", adminWhyChooseUsRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/banner-link-options", adminBannerLinkOptionsRoutes);
app.use("/api/admin/product-faq", adminProductFaqRoutes);
app.use("/api/admin/home-page", homePageAdminRoutes);
app.use("/api/admin/audit-log", auditLogRoutes);
app.get("/api/admin/csrf-token", getCsrfToken);

app.get("/", (_req, res) => {
  res.send("server started");
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = env.PORT;
mongoose
  .connect(env.NEW_DB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is working on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

export default app;
