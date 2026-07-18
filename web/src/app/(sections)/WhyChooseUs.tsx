import { Card, CardContent } from "@/components/ui/card";
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

// Toy-box palette — one candy color per card, cycled by index.
// Kept as inline style (not Tailwind classes) since these are fixed
// brand accents independent of the light/dark theme tokens.
const TOY_PALETTE = [
  { bg: "#FF6B6B", soft: "#FFE3E3", shadow: "rgba(255,107,107,0.35)" }, // coral
  { bg: "#4DABF7", soft: "#E7F5FF", shadow: "rgba(77,171,247,0.35)" }, // sky
  { bg: "#F59F00", soft: "#FFF3BF", shadow: "rgba(245,159,0,0.35)" }, // amber
  { bg: "#51CF66", soft: "#EBFBEE", shadow: "rgba(81,207,102,0.35)" }, // grass
] as const;

// Alternating resting tilts so the row reads like toys set down on a
// shelf, not a rigid grid. motion-safe: keeps this off for users who
// have reduced motion enabled.
const TILTS = [
  "motion-safe:-rotate-2",
  "motion-safe:rotate-1",
  "motion-safe:-rotate-1",
  "motion-safe:rotate-2",
];

type WhyChooseUsData = {
  _id: string;
  image: string;
  title: string;
  description: string;
};

const WhyChooseUsItem = ({
  item,
  index,
}: {
  item: WhyChooseUsData;
  index: number;
}) => {
  const IconComponent = iconMap[item.image] || Gem;
  const palette = TOY_PALETTE[index % TOY_PALETTE.length];
  const tilt = TILTS[index % TILTS.length];

  return (
    <div
      className={`group relative ${tilt} transition-transform duration-300 ease-out motion-safe:hover:rotate-0 motion-safe:hover:-translate-y-1.5`}
    >
      <Card
        className="relative overflow-visible rounded-[28px] border-2 bg-card pt-9 transition-shadow duration-300"
        style={{
          borderColor: palette.soft,
          boxShadow: `0 10px 0 0 ${palette.bg}`,
        }}
      >
        {/* Icon badge, popped above the card edge like a block stud */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl ring-4 ring-background transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{ backgroundColor: palette.bg }}
          >
            <IconComponent size={28} className="text-white" strokeWidth={2} />
          </div>
          {/* two little studs either side, echoing a toy brick */}
          <span
            className="absolute -top-1.5 left-1"
            style={{ color: palette.bg }}
          >
            <span className="block h-2 w-2 rounded-full bg-current opacity-60" />
          </span>
          <span
            className="absolute -top-1.5 right-1"
            style={{ color: palette.bg }}
          >
            <span className="block h-2 w-2 rounded-full bg-current opacity-60" />
          </span>
        </div>

        <CardContent className="flex flex-col items-center px-6 pb-8 pt-2 text-center sm:px-7">
          <h3 className="fw-heading mb-2 text-base font-bold text-foreground md:text-lg">
            {item.title}
          </h3>
          <p className="fw-body text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {item.description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const WhyChooseUsContent = async () => {
  const data = await getWhyChooseUs();
  const features: WhyChooseUsData[] = data;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-8">
      {features?.map((item, index) => (
        <WhyChooseUsItem key={item._id} item={item} index={index} />
      ))}
    </div>
  );
};

const SkeletonCard = ({ index }: { index: number }) => {
  const palette = TOY_PALETTE[index % TOY_PALETTE.length];
  return (
    <div className="relative pt-9">
      <div
        className="rounded-[28px] border-2 bg-muted/20 pb-8 pt-2"
        style={{ borderColor: palette.soft }}
      >
        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
          <Skeleton className="h-16 w-16 rounded-2xl" />
        </div>
        <div className="flex flex-col items-center gap-3 px-6 pt-9">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
};

const WhyChooseUs = () => {
  return (
    <section
      className="relative w-full overflow-hidden bg-section py-12 lg:py-20"
      aria-labelledby="why-choose-us"
    >
      <div className="section-container relative z-10">
        <div className="mb-14 text-center lg:mb-20">
          <h2
            id="why-choose-us"
            className="section-heading relative inline-block mb-4"
          >
            Why Choose Us
            {/* hand-drawn squiggle underline — the section's signature mark */}
            <svg
              viewBox="0 0 120 12"
              className="absolute -bottom-3 left-1/2 h-3 w-28 -translate-x-1/2 text-[#FF6B6B]"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 8 Q 20 1 40 7 T 78 6 T 118 4"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </h2>
          <p className="section-subheading mt-6">
            Experience excellence in every aspect of your toy shopping
            experience
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-8">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} index={i} />
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
