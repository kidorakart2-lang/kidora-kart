import type { Request, Response } from "express";
import Coupen from "../../models/coupen.js";
import { success, fail } from "../../utils/responses.js";

export const coupenPopUp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const coupenId = req.params.id;
    const coupen = await Coupen.findById(coupenId);
    if (!coupen) return fail(res, "Coupen Not Found", 404);
    return success(res, coupen, "Coupen Found");
  } catch (error) {
    console.error("Coupen Pop Up Error:", error);
    return fail(res, "Couldnt Find Coupen", 500);
  }
};

export const findCoupen = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;
    const coupen = await Coupen.find({
      userId,
      deletedAt: null,
      status: true,
      isUsed: false,
    });
    return success(res, coupen, "Coupen Found");
  } catch (error) {
    console.error("Coupen Pop Up Error:", error);
    return fail(res, "Couldnt Find Coupen", 500);
  }
};