import { Suspense } from "react";
import { cookies } from "next/headers";
import SubSubCategoriesClient, { type SubSubCategoryItem } from "./SubSubCatClient";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getSubSubCategories(token: string): Promise<SubSubCategoryItem[]> {
  try {
    return (await api.post<SubSubCategoryItem[]>("/api/admin/subSubCategory/view", {}, token)) || [];
  } catch (error) {
    console.error("Error fetching sub sub categories:", error);
    return [];
  }
}

async function getSubCategories(token: string): Promise<Category[]> {
  try {
    return (await api.post<Category[]>("/api/admin/subCategory/view", {}, token)) || [];
  } catch (error) {
    console.error("Error fetching sub categories:", error);
    return [];
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SubSubCategoriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;

  const [initialSubSubCategories, initialSubCategories] = await Promise.all([
    getSubSubCategories(token ?? ""),
    getSubCategories(token ?? ""),
  ]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SubSubCategoriesClient
        initialSubSubCategories={initialSubSubCategories}
        initialSubCategories={initialSubCategories}
      />
    </Suspense>
  );
}
