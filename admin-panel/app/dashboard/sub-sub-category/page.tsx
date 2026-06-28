import { Suspense } from "react";
import { cookies } from "next/headers";
import SubSubCategoriesClient from "./SubSubCatClient";

export const dynamic = "force-dynamic";

async function getSubSubCategories(token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/"}api/admin/subSubCategory/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sub sub categories");
    }

    const data = await response.json();
    return Array.isArray(data?._data)
      ? data._data
      : Array.isArray(data)
      ? data
      : [];
  } catch (error) {
    console.error("Error fetching sub sub categories:", error);
    return [];
  }
}

async function getSubCategories(token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/"}api/admin/subCategory/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sub categories");
    }

    const data = await response.json();
    return data._data || data;
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
