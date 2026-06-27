import productModel from "../models/product.js";
import category from "../models/category.js";
import subCategory from "../models/subCategory.js";
import subSubCategory from "../models/subSubCategory.js";

type BannerLinkType = "product" | "category" | "subCategory" | "subSubCategory" | "external";

interface BannerLink {
  type: BannerLinkType;
  target?: string | null;
  externalUrl?: string | null;
  label?: string | null;
}

interface ResolvedLink {
  url: string;
  label: string | null;
}

const resolve = async (link: BannerLink): Promise<ResolvedLink | null> => {
  if (!link) return null;

  if (link.type === "external") {
    return { url: link.externalUrl || "#", label: link.label ?? null };
  }

  let doc: { slug?: string; name?: string } | null = null;
  if (link.type === "product") {
    doc = await productModel
      .findById(link.target)
      .select("slug name")
      .lean();
  } else if (link.type === "category") {
    doc = await category.findById(link.target).select("slug name").lean();
  } else if (link.type === "subCategory") {
    doc = await subCategory
      .findById(link.target)
      .select("slug name")
      .lean();
  } else if (link.type === "subSubCategory") {
    doc = await subSubCategory
      .findById(link.target)
      .select("slug name")
      .lean();
  }

  if (!doc || !doc.slug) return null;

  const anchor = doc.slug;
  if (link.type === "category") return { url: `/category/${anchor}`, label: doc.name ?? link.label ?? null };
  if (link.type === "subCategory") return { url: `/subcategory/${anchor}`, label: doc.name ?? link.label ?? null };
  if (link.type === "subSubCategory") return { url: `/subsubcategory/${anchor}`, label: doc.name ?? link.label ?? null };
  return { url: `/product/${anchor}`, label: doc.name ?? link.label ?? null };
};

export { resolve, type ResolvedLink, type BannerLink };
