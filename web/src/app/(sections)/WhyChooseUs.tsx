import { Skeleton } from "@/components/ui/skeleton";
import {
  Gem,
  Gift,
  ShieldCheck,
  Sparkles,
  Award,
  Heart,
  Star,
  ThumbsUp,
  Shield,
  CheckCircle,
  Sparkle,
} from "lucide-react";
import { Suspense } from "react";
import { getWhyChooseUs } from "@/lib/get-why-choose-us";

const iconMap: Record<string, typeof Gem> = {
  Gem,
  Award,
  ShieldCheck,
  Sparkles,
  Heart,
  Star,
  ThumbsUp,
  Shield,
  CheckCircle,
  Gift,
  Sparkle,
};

type WhyChooseUsData = {
  _id: string;
  image: string;
  title: string;
  description: string;
};

const iconForTitle = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("gift")) return Gift;
  if (t.includes("return") || t.includes("day")) return CheckCircle;
  if (t.includes("everyday")) return Sparkles;
  if (t.includes("silver")) return ShieldCheck;
  return Gem;
};

const WhyChooseUsItem = ({ item }: { item: WhyChooseUsData }) => {
  const IconComponent = iconMap[item.image] || iconForTitle(item.title);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[var(--brand-rose)] bg-[var(--brand-section-bg)] px-4 py-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-gold)]/50 hover:bg-white hover:shadow-[0_22px_44px_-32px_rgba(74,37,66,0.5)] sm:px-6 sm:py-7 lg:px-7">
      <span
        className="absolute right-5 top-5 text-[var(--brand-gold)]/45 transition-colors group-hover:text-[var(--brand-gold)]"
        aria-hidden="true"
      >
        <Sparkle size={14} />
      </span>

      <span className="mb-4 grid size-10 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-white text-[var(--brand-gold-dark)] shadow-[0_8px_18px_-14px_rgba(74,37,66,0.5)] sm:mb-5 sm:size-11">
        <IconComponent size={17} strokeWidth={1.6} />
      </span>

      <h3 className="display-heading text-base leading-snug sm:text-[1.15rem] lg:text-xl">
        {item.title}
      </h3>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--brand-ink)]/70 sm:mt-2.5 sm:text-[12.5px]">
        {item.description}
      </p>

      <span className="mt-auto block pt-5">
        <span className="block h-px w-8 bg-[var(--brand-gold)]/55 transition-all duration-300 group-hover:w-14" />
      </span>
    </article>
  );
};

const WhyChooseUsContent = async () => {
  const data = await getWhyChooseUs();
  const features: WhyChooseUsData[] = data;

  if (!features?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {features.map((item) => (
        <WhyChooseUsItem key={item._id} item={item} />
      ))}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl border border-[var(--brand-rose)] bg-[var(--brand-section-bg)] p-6">
    <Skeleton className="mb-5 size-11 rounded-full" />
    <Skeleton className="mb-2 h-4 w-28" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="mt-1.5 h-3 w-3/4" />
  </div>
);

const WhyChooseUs = () => {
  return (
    <section
      className="relative w-full overflow-hidden bg-white py-16 lg:py-20"
      aria-labelledby="why-choose-us"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[760px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(247,226,234,0.7),rgba(247,226,234,0)_78%)]"
        aria-hidden="true"
      />

      <div className="section-container relative z-10">
        <div className="mb-11 text-center lg:mb-14">
          <p className="eyebrow mb-4">
            <span className="mr-2">✦</span>
            The Ratnavya promise
          </p>
          <h2
            id="why-choose-us"
            className="display-heading text-3xl sm:text-4xl lg:text-[2.75rem]"
          >
            Why Choose <span className="accent-italic">Ratnavya?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[13px] leading-relaxed text-[var(--brand-ink)]/70 sm:text-sm">
            The little details that make every order feel as considered as the
            jewellery itself.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          }
        >
          <WhyChooseUsContent />
        </Suspense>
      </div>
    </section>
  );
};

export default WhyChooseUs;
