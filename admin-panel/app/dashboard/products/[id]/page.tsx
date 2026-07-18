"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ProductDetails, { type ProductData } from "../ProductDetails";

export default function page() {
  const { id } = useParams();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      return api.post<ProductData>(`/api/admin/product/details/${id}`, {});
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  if (isLoading) {
    return <div className="p-8">Loading product details...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading product: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  if (!product) {
    return <div className="p-8">Product not found</div>;
  }

  return <ProductDetails product={product} />;
}
