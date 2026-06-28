import React from "react";
import ProductDetails from "../ProductDetails";
import { toast } from "@/hooks/use-toast";
import { cookies } from "next/headers";

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function page({ params }: PageParams) {
  const { id } = await params;
  const cookiesStore = await cookies();

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/"}api/admin/product/details/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cookiesStore.get("adminToken")?.value}`,
      },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (!response.ok || data._status === false) {
      return <div>{data._message || "Product not found"}</div>;
    }
    return <ProductDetails product={data._data} />;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error loading product:", errorMessage);
    return <div>Error loading product {errorMessage}</div>;
  }
}
