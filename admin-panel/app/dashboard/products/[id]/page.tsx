import React from "react";
import ProductDetails, { type ProductData } from "../ProductDetails";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageParams) {
  const { id } = await params;
  const cookiesStore = await cookies();

  try {
    const data = await api.post<ProductData>(`/api/admin/product/details/${id}`, {}, cookiesStore.get("adminToken")?.value);
    if (!data) {
      return <div>Product not found</div>;
    }
    return <ProductDetails product={data} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error loading product:", errorMessage);
    return <div>Error loading product {errorMessage}</div>;
  }
}
