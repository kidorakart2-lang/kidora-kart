import SimpleLoading from "@/components/comman/SimpleLoading";
import { Suspense } from "react";
import Search from "./Search";

const getProducts = async (q: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/product/get-by-search?search=${q}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    const data = await response.json();
    if (!response.ok || !data._status) return null;
    return data._data;
  } catch {
    return null;
  }
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParams;

  return (
    <div>
      <Suspense fallback={<SimpleLoading type="page" />}>
        <SearchResults q={q} />
      </Suspense>
    </div>
  );
}

interface SearchResultProps {
  q: string | undefined;
}

async function SearchResults({ q }: SearchResultProps) {
  const products = await getProducts(q || "");

  return <Search products={products} q={q} />;
}
