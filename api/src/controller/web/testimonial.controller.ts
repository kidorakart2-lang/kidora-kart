import Testimonial from "../../models/testimonial.js";
import { buildCacheListController } from "./_helpers.js";

export const testimonialController = buildCacheListController(Testimonial, {
  cacheKey: "testimonialData",
});