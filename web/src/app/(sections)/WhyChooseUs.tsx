import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gem, Gift, ShieldCheck, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { getWhyChooseUs } from "@/lib/get-why-choose-us";

const iconMap: Record<string, typeof Gem> = {
  Gem,
  ShieldCheck,
  Sparkles,
  Gift,
};

const WhyChooseUsItem = ({ item, index }: { item: { _id: string; image: string; title: string; description: string }; index: number }) => {
  const IconComponent = iconMap[item.image] || Gem;

  return (
    <Card className="card-hover border bg-card">
      <CardContent className="flex flex-col items-center p-6 sm:p-8 relative z-10">
        <div className="relative mb-5 rounded-full p-4 bg-muted">
          <IconComponent
            size={32}
            className="text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <h3 className="text-base md:text-lg fw-heading text-foreground mb-2 text-center">
          {item.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed fw-body">
          {item.description}
        </p>
      </CardContent>
    </Card>
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

const WhyChooseUs = () => {
  return (
    <section
      className="w-full py-2 lg:py-4 bg-section relative overflow-hidden"
      aria-labelledby="why-choose-us"
    >
      <div className="section-container relative z-10">
        <div className="text-center mb-12 lg:mb-16">
          <h2 id="why-choose-us" className="section-heading mb-4">
            Why Choose Us
          </h2>
          <p className="section-subheading">
            Experience excellence in every aspect of your toy shopping experience
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-muted/30">
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
