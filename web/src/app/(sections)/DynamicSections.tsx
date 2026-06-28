import { cache } from "react";
import dynamic from "next/dynamic";
import Banner from "./Banner";
import WhyChooseUs from "./WhyChooseUs";

const Slider = dynamic(() => import("./Slider"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />,
});
const Testimonial = dynamic(() => import("./Testimonial"), {
  loading: () => <div className="h-80 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />,
});
const RoundCategorySlider = dynamic(() => import("./RoundCategorySlider"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-6" />,
});
const MenWomen = dynamic(() => import("./MenWomen"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-6" />,
});
const ShopByPrice = dynamic(() => import("./ShopbyPrice"), {
  loading: () => <div className="h-80 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />,
});
const FullVideoSection = dynamic(() => import("./video"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />,
});
const BentoGrid = dynamic(() => import("./BentoGrid"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />,
});

export interface HomeSection {
  _id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

const getHomeSections = cache(async () => {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/home-page",
      { next: { revalidate: 3600 } },
    );
    const data = await res.json();
    return (data._data?.sections ?? []) as HomeSection[];
  } catch {
    return [];
  }
});

export { getHomeSections };

export default async function DynamicSections() {
  const sections = await getHomeSections();

  if (sections.length === 0) return null;

  // Filter out hidden sections, sort by order
  const visible = sections
    .filter((s) => !s.config?.hidden)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {visible.map((section) => (
        <DynamicSection key={section._id} section={section} />
      ))}
    </>
  );
}

// ──────────────────────────────────────
// Section renderers
// ──────────────────────────────────────

function SectionHeader({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <div className="text-center py-8">
      <h2 className="text-3xl md:text-4xl font-serif text-foreground">{title}</h2>
    </div>
  );
}

async function DynamicSection({ section }: { section: HomeSection }) {
  const cfg = section.config;

  switch (section.type) {
    case "banner":
      return <Banner />;

    case "round-categories":
      return <RoundCategorySlider />;

    case "category-grid":
      return <MenWomen />;

    case "product-slider": {
      const source = (cfg.productSource as string) ?? "new-arrivals";
      const limit = (cfg.limit as string) ?? "10";
      const heading = (cfg.heading as string) ?? "";
      const products = await fetchProducts(source, parseInt(limit, 10));
      if (!products || products.length === 0) return null;
      return <Slider data={products} heading={heading} />;
    }

    case "products-tab": {
      const searchTerms = ((cfg.searchTerms as string) ?? "earrings,necklace,bracelet")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      // We render a simplified version since the TabProducts component
      // expects specific data structure. For dynamic sections, we
      // render Slider components per search term.
      return (
        <>
          {searchTerms.map((term) => (
            <ProductsTabSection key={term} searchTerm={term} heading={cfg.heading as string} />
          ))}
        </>
      );
    }

    case "shop-by-price":
      return <ShopByPrice />;

    case "why-choose-us":
      return <WhyChooseUs bg={(cfg.bgColor as string) ?? "bg-[#f8f8f8]"} />;

    case "testimonial": {
      const testimonials = await fetchTestimonials();
      if (!testimonials || testimonials.length === 0) return null;
      return (
        <Testimonial
          data={testimonials}
          bg={(cfg.bgColor as string) ?? "bg-[#f8f8f8]/50"}
        />
      );
    }

    case "video-banner":
      return <FullVideoSection />;

    case "bento-grid": {
      const heading = cfg.heading as string | undefined;
      const layout = cfg.layout as string | undefined;
      const cells = cfg.cells as { image?: string; title?: string; subtitle?: string; linkType?: string; linkTarget?: string; linkExternalUrl?: string }[] | undefined;
      if (!cells || cells.length === 0) return null;
      return <BentoGrid heading={heading} layout={layout} cells={cells} />;
    }

    case "custom": {
      const html = cfg.html as string;
      if (!html) return null;
      return (
        <section
          className="w-full py-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    default:
      return null;
  }
}

// ── Helper: Products tab section ──

async function ProductsTabSection({
  searchTerm,
  heading,
}: {
  searchTerm: string;
  heading?: string;
}) {
  const products = await fetchProductsBySearch(searchTerm);
  if (!products || products.length === 0) return null;
  return <Slider data={products} heading={heading || searchTerm} />;
}

// ── Data fetching helpers ──

async function fetchProducts(source: string, limit: number) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `api/website/product/${source}?limit=${limit}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data._data ?? [];
  } catch {
    return [];
  }
}

async function fetchProductsBySearch(term: string) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `api/website/product/get-by-search?search=${encodeURIComponent(term)}&limit=8`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data._data ?? [];
  } catch {
    return [];
  }
}

async function fetchTestimonials() {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/testimonial",
      { next: { revalidate: 3600 } },
    );
    const data = await res.json();
    return data._data;
  } catch {
    return null;
  }
}
