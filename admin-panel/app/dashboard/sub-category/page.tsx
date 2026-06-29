import { Suspense } from "react";
import { cookies } from "next/headers";
import SubCategoriesClient, { type SubCategoryItem } from "./SubCategoryClient";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getSubCategories(): Promise<SubCategoryItem[]> {
  try {
    const token = (await cookies()).get("adminToken")?.value;
    return (await api.post<SubCategoryItem[]>("/api/admin/subCategory/view", {}, token)) || [];
  } catch (error) {
    console.error("Error fetching sub categories:", error);
    return [];
  }
}

async function getCategories(): Promise<any[]> {
  try {
    const token = (await cookies()).get("adminToken")?.value;
    return (await api.post("/api/admin/category/view", {}, token)) || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
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

export default async function SubCategoriesPage() {
  const [initialSubCategories, initialCategories] = await Promise.all([
    getSubCategories(),
    getCategories(),
  ]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SubCategoriesClient
        initialSubCategories={initialSubCategories}
        initialCategories={initialCategories}
      />
    </Suspense>
  );
}
