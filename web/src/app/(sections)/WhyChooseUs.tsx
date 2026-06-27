import { Skeleton } from "@/components/ui/skeleton";
import { Gem, Gift, ShieldCheck, Sparkles } from "lucide-react";
import { cache, Suspense } from "react";

const getWhyChooseUs = cache(async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/whyChooseUs",
      {
        next: {
          revalidate: 3600,
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      return data._data;
    }
  } catch {
    return null;
  }
});

const iconMap = {
  Gem: Gem,
  ShieldCheck: ShieldCheck,
  Sparkles: Sparkles,
  Gift: Gift,
};

const WhyChooseUsItem = ({ item, index }: { item: { _id: string; image: string; title: string; description: string }; index: number }) => {
  const IconComponent = iconMap[item.image as keyof typeof iconMap] || Gem;

  const colorSchemes = [
    {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      iconBg: "bg-amber-100",
      ring: "group-hover:ring-amber-200",
    },
    {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      iconBg: "bg-rose-100",
      ring: "group-hover:ring-rose-200",
    },
    {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      iconBg: "bg-emerald-100",
      ring: "group-hover:ring-emerald-200",
    },
    {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      iconBg: "bg-purple-100",
      ring: "group-hover:ring-purple-200",
    },
  ];

  const scheme = colorSchemes[index % 4];

  return (
    <article
      className={`group relative flex flex-col items-center ${scheme.bg} rounded-2xl p-6 sm:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer border border-transparent ${scheme.ring} ring-0 hover:ring-4 ring-offset-2`}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      {/* Icon Container */}
      <div
        className={`relative mb-5 ${scheme.iconBg} rounded-full p-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}
      >
        <IconComponent
          size={32}
          className={`${scheme.icon} transition-all duration-500`}
          strokeWidth={1.5}
        />

        {/* Sparkle Effect on Hover */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"></div>
      </div>

      {/* Title */}
      <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-2 text-center relative z-10">
        {item.title}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-600 text-center leading-relaxed relative z-10 font-light">
        {item.description}
      </p>

      {/* Bottom Accent Line */}
      <div
        className={`mt-4 h-1 w-0 ${scheme.icon.replace(
          "text-",
          "bg-"
        )} rounded-full transition-all duration-500 group-hover:w-16`}
      ></div>
    </article>
  );
};

const WhyChooseUsContent = async () => {
  const data = await getWhyChooseUs();
  const features = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
      {features?.map((item: { _id: string; image: string; title: string; description: string }, index: number) => (
        <WhyChooseUsItem key={item._id} item={item} index={index} />
      ))}
    </div>
  );
};

const WhyChooseUs = ({ bg = "" }: { bg?: string }) => {
  return (
    <section
      className={`w-full py-2 lg:py-4 ${bg} bg-gradient-to-b from-white via-amber-50/20 to-white relative overflow-hidden`}
      aria-labelledby="why-choose-us"
    >
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-amber-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-rose-100/30 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
            <h2
              id="why-choose-us"
              className="text-3xl md:text-4xl lg:text-5xl font-serif text-slate-800 tracking-wide"
            >
              Why Choose Us
            </h2>
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-600"></div>
            <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-600"></div>
          </div>

          <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Experience excellence in every aspect of your jewellery shopping
          </p>
        </div>

        {/* Content Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center space-y-4 p-8 bg-slate-50 rounded-2xl"
                >
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
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
