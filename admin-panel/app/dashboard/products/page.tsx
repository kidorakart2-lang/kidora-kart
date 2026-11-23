import { Suspense } from "react";
import ProductsPage from "./ProductPage";

export default async function page() {
  return (
    <Suspense fallback={null}>
      <ProductsPage />
    </Suspense>
  );
}
