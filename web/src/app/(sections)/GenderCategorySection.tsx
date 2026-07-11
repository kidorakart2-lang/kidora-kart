"use client";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CategoryItem {
  _id: string;
  name: string;
  image?: string;
  slug?: string;
}

interface GenderCategorySectionProps {
  heading?: string;
  sourceType?: string;
  selectedItemIds?: string[];
}

export default function GenderCategorySection({
  heading,
  sourceType,
  selectedItemIds,
}: GenderCategorySectionProps) {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];

  if (sourceType && selectedItemIds && selectedItemIds.length > 0) {
    const displayItems: { _id: string; name: string; image: string; slug: string }[] = [];

    for (const cat of categories) {
      const catId = cat._id || "";
      const catName = cat.name || "";
      const catSlug = cat.slug || catId;

      if (sourceType === "category") {
        if (catId && selectedItemIds.includes(catId)) {
          displayItems.push({
            _id: catId,
            name: catName,
            image: cat.image || "",
            slug: catSlug,
          });
        }
      } else if (sourceType === "subCategory") {
        for (const sub of cat.subCategories || []) {
          const subId = sub._id || "";
          if (subId && selectedItemIds.includes(subId)) {
            displayItems.push({
              _id: subId,
              name: sub.name || "",
              image: sub.image || "",
              slug: `${catSlug}/${sub.slug || subId}`,
            });
          }
        }
      } else if (sourceType === "subSubCategory") {
        for (const sub of cat.subCategories || []) {
          const subId = sub._id || "";
          const subSlug = sub.slug || subId;
          const subSubs = (sub as any).subSubCategories || [];
          for (const ssub of subSubs) {
            const ssubId = ssub._id || "";
            if (ssubId && selectedItemIds.includes(ssubId)) {
              displayItems.push({
                _id: ssubId,
                name: ssub.name || "",
                image: ssub.image || "",
                slug: `${catSlug}/${subSlug}/${ssub.slug || ssubId}`,
              });
            }
          }
        }
      }
    }

    if (displayItems.length === 0) return null;

    return (
      <div className="w-full max-w-[100vw] mx-auto py-10 px-4 overflow-hidden">
        <div className="text-center mb-12 relative">
          <div className="inline-block relative">
            <h2 className="text-4xl md:text-5xl fw-heading mb-3 tracking-wide text-foreground">
              {heading || "Explore Our Collection"}
            </h2>
          </div>

          <p className="text-muted-foreground mt-6 fw-body tracking-widest text-sm md:text-base">
            Shop by Category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[75vh] max-h-[600px]">
          {displayItems.map((item, index) => (
            <Link
              key={item._id}
              className="h-full group relative"
              href={`/category/${item.slug}`}
            >
              <div className="relative overflow-hidden h-full rounded-lg shadow-lg">
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/50" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-sans fw-heading text-background mb-4 tracking-wider">
                    {item.name}
                  </h3>

                  <div className="relative overflow-hidden">
                    <Button
                      variant="gradient"
                      size="lg"
                      className="rounded-full text-sm tracking-widest shadow-lg"
                    >
                      SHOP NOW
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  function getCategoryWithMensAndWomens(categories: CategoryData[]) {
    const categoryWithSubs = categories?.find(
      (cat: CategoryData) => cat?.subCategories && cat?.subCategories?.length > 0
    );

    if (!categoryWithSubs) {
      return [];
    }

    const filteredSubCategories = categoryWithSubs?.subCategories?.filter(
      (sub: SubCategoryData) => sub.name === "Mens" || sub.name === "Womens"
    );

    return [
      {
        ...categoryWithSubs,
        subCategories: filteredSubCategories,
      },
    ];
  }

  const result = getCategoryWithMensAndWomens(categories);

  if (!result[0]?.subCategories || result[0]?.subCategories?.length === 0) return null;

  return (
    <div className="w-full max-w-[100vw] mx-auto py-10 px-4 overflow-hidden">
      <div className="text-center mb-12 relative">
        <div className="inline-block relative">
          <h2 className="text-4xl md:text-5xl fw-heading mb-3 tracking-wide text-foreground">
            {heading || result[0].name}
          </h2>
        </div>

        <p className="text-muted-foreground mt-6 fw-body tracking-widest text-sm md:text-base">            Shop by Category
          </p>
      </div>

      {result.map((category) => (
        <div
          key={category._id}
          className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[75vh] max-h-[600px]"
        >
          {category.subCategories?.map((subCategory, index) => (
            <Link
              key={subCategory._id}
              className="h-full group relative"
              href={`/category/${category.slug}/${subCategory.slug}`}
            >
              <div className="relative overflow-hidden h-full rounded-lg shadow-lg">
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                  <Image
                    src={subCategory.image ?? ""}
                    alt={subCategory.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/50" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-sans fw-heading text-background mb-4 tracking-wider">
                    {subCategory.name}
                  </h3>

                  <div className="relative overflow-hidden">
                    <Button
                      variant="gradient"
                      size="lg"
                      className="rounded-full text-sm tracking-widest shadow-lg"
                    >
                      SHOP NOW
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
