import type { Request, Response } from "express";
import User from "../../models/user.js";
import Order from "../../models/order.js";
import Product from "../../models/product.js";
import { logger } from "../../lib/logger.js";
export const getDashboardStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenueResult,
      lastWeekUsers,
      lastWeekOrders,
      // lastWeekRevenue — referenced in original code but unused
    ] = await Promise.all([
      Product.countDocuments({ deletedAt: null }),
      User.countDocuments({ isDeleted: { $ne: true } }),
      Order.countDocuments({ isDeleted: { $ne: true } }),
      Order.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            status: { $nin: ["cancelled", "returned"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$pricing.total" } } },
      ]),
      User.countDocuments({
        createdAt: { $gte: oneWeekAgo },
        isDeleted: { $ne: true },
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo },
            status: { $nin: ["cancelled", "returned"] },
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$pricing.total" },
          },
        },
      ]),
    ]);

    const totalRevenue = (totalRevenueResult[0] as Record<string, unknown>)?.total ?? 0;
    const lastWeekOrdersData = (lastWeekOrders[0] as Record<string, unknown>) ?? {
      count: 0,
      revenue: 0,
    };

    const stats = {
      totals: {
        products: totalProducts,
        users: totalUsers,
        orders: totalOrders,
        revenue: totalRevenue,
      },
      lastWeek: {
        newUsers: lastWeekUsers,
        newOrders: lastWeekOrdersData.count,
        revenue: lastWeekOrdersData.revenue,
        startDate: oneWeekAgo,
        endDate: now,
      },
    };

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getDashboardStats");
    res.status(500).json({
      success: false,
      message: "Error retrieving dashboard statistics",
      error: "Internal Server Error",
    });
  }
};

export const getRecentActivity = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentOrders = await Order.find({
      createdAt: { $gte: oneWeekAgo },
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email avatar")
      .select("orderId pricing.total pricing.status createdAt");

    const recentUsers = await User.find({
      createdAt: { $gte: oneWeekAgo },
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name email createdAt avatar");

    res.status(200).json({
      success: true,
      message: "Recent activity retrieved successfully",
      data: {
        recentOrders,
        recentUsers,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error in getRecentActivity");
    res.status(500).json({
      success: false,
      message: "Error retrieving recent activity",
      error: "Internal Server Error",
    });
  }
};

const dashboard = {
  getDashboardStats,
  getRecentActivity,
};

export default dashboard;