import React from "react";
import ProductsPage from "./ProductPage";
import { cache } from "react";
import Cookies from "js-cookie";

// const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
// const getAuthHeaders = async () => ({
//   Authorization: `Bearer ${await Cookies.get("adminToken")}`,
// });

// const getCaegory = cache(async () => {
//   try {
//     const response = await fetch(`${API_BASE}api/admin/category/view`, {
//       method: "POST",
//       headers: getAuthHeaders(),
//       body: JSON.stringify({}),
//     });
//     if (response.ok) {
//       const data = await response.json();
//       return data._data || [];
//     }
//   } catch (error) {
//     console.error("Error loading categories:", error);
//   }
// });

export default async function page() {
  // const category = await getCaegory();
  return <ProductsPage />;
}
