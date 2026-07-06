import dynamic from "next/dynamic";
import BannerSingle from "./BannerSingle";
import BannerSlider from "./BannerSlider";
import WhyChooseUs from "./WhyChooseUs";
import {
  getHomeSections,
  getWebsiteBanners,
  fetchProducts,
  fetchProductsBySearch,
  fetchTestimonials,
  type HomeSection,
} from "@/lib/home-data";

const Slider = dynamic(() => import("./Slider"), {
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const Testimonial = dynamic(() => import("./Testimonial"), {
  loading: () => <div className="h-80 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const RoundCategorySlider = dynamic(() => import("./RoundCategorySlider"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-6" />,
});
const SquareCategorySlider = dynamic(() => import("./SquareCategorySlider"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-6" />,
});
const GenderCategorySection = dynamic(() => import("./GenderCategorySection"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-6" />,
});
const ShopByPrice = dynamic(() => import("./ShopbyPrice"), {
  loading: () => <div className="h-80 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});
const PromoBannerSection = dynamic(() => import("./PromoBannerSection").then((m) => ({ default: m.PromoBannerSection })), {
  loading: () => <div className="h-[65vh] bg-muted animate-pulse mx-auto" />,
});
const VideoSection = dynamic(() => import("./VideoSection").then((m) => ({ default: m.VideoSection })), {
  loading: () => <div className="h-[65vh] bg-muted animate-pulse mx-auto" />,
});
const BentoGrid = dynamic(() => import("@/components/bento"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg mx-4 my-8" />,
});



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
  const cfg = section.config ?? {};

  switch (section.type) {
    case "banner":
      return (
        <BannerFromConfig
          selectedBannerIds={cfg.selectedBannerIds as string[] | undefined}
          bannerMode={cfg.bannerMode as "single" | "slider" | undefined}
        />
      );

    case "round-categories":
      return <RoundCategorySlider heading={cfg.heading as string | undefined} />;

    case "square-categories":
      return <SquareCategorySlider heading={cfg.heading as string | undefined} />;

    case "category-grid":
      return (
        <GenderCategorySection
          heading={cfg.heading as string | undefined}
          sourceType={cfg.categorySourceType as string | undefined}
          selectedItemIds={cfg.categorySelectedIds as string[] | undefined}
        />
      );

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
      return <ShopByPrice heading={cfg.heading as string | undefined} />;

    case "why-choose-us":
      return <WhyChooseUs />;

    case "testimonial": {
      const testimonials = await fetchTestimonials();
      if (!testimonials || testimonials.length === 0) return null;
      return <Testimonial data={testimonials} />;
    }

    case "promo-banner":
      return (
        <PromoBannerSection
          heading={cfg.heading as string | undefined}
          buttonText={cfg.buttonText as string | undefined}
          selectedBannerId={cfg.selectedBannerId as string | undefined}
          bannerImage={cfg.bannerImage as string | undefined}
          bannerLinkData={cfg.bannerLinkData as { type?: string; target?: string; externalUrl?: string; label?: string } | undefined}
        />
      )

    case "video":
      return (
        <VideoSection
          heading={cfg.heading as string | undefined}
          subtitle={cfg.subtitle as string | undefined}
          buttonText={cfg.buttonText as string | undefined}
          buttonUrl={cfg.buttonUrl as string | undefined}
          videoUrl={cfg.videoUrl as string | undefined}
          selectedBannerId={cfg.selectedBannerId as string | undefined}
          bannerLinkData={cfg.bannerLinkData as { type?: string; target?: string; externalUrl?: string; label?: string } | undefined}
        />
      )

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

// ── Banner helper ──

async function BannerFromConfig({
  selectedBannerIds,
  bannerMode,
}: {
  selectedBannerIds?: string[]
  bannerMode?: "single" | "slider"
}) {
  const allBanners = await getWebsiteBanners()

  const banners = selectedBannerIds && selectedBannerIds.length > 0
    ? allBanners.filter((b) => b._id && selectedBannerIds.includes(b._id))
    : allBanners

  if (!banners || banners.length === 0) return null

  const slides = banners.map((item) => ({
    src: item.image,
    href: item.link?.url || undefined,
    external: item.link?.type === "external",
  }))

  if (bannerMode === "single" || slides.length === 1) {
    return <BannerSingle slide={slides[0]} />
  }

  return <BannerSlider slides={slides} />
}
