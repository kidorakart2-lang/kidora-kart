import SimpleLoading from "@/components/comman/SimpleLoading";
import { cacheLife, cacheTag } from "next/cache";
import { TAG_SEARCH } from "@/lib/revalidation-tags";
import { Suspense } from "react";
import Search from "./Search";

async function getProducts(q: string) {
  "use cache";
  cacheLife("search");
  cacheTag(TAG_SEARCH);

  try {
    const response = await fetch(`/api/website/product/get-by-search?search=${q}`);
    const data = await response.json();
    if (!response.ok || !data._status) return null;
    return data._data;
  } catch {
    return null;
  }
}

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
