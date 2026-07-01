"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import ProductCard from "@/components/comman/ProductCard";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Slider = ({ data, heading }: { data: any[] | null | undefined; heading: string }) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section className="relative py-10 overflow-hidden bg-section" id={heading}>
      <div className="section-container">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            <h2 className="text-4xl md:text-5xl font-serif tracking-wide section-heading">
              {heading}
            </h2>
            <Sparkles className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary))` }} />
            <div className="w-8 h-1.5 rounded-full shadow-lg" style={{ backgroundColor: "var(--brand-primary)", boxShadow: "0 4px 6px -1px color-mix(in srgb, var(--brand-primary) 30%, transparent)" }} />
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, var(--brand-primary))` }} />
          </div>
        </div>

        <div className="py-8 relative">
          <Swiper
            modules={[Autoplay, EffectCoverflow]}
            spaceBetween={20}
            slidesPerView={1}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={800}
            loop={false}
            observer={true}
            observeParents={true}
            centeredSlides={false}
            breakpoints={{
              320: { slidesPerView: 1.3, spaceBetween: 20 },
              450: { slidesPerView: 1.5, spaceBetween: 15 },
              768: { slidesPerView: 3, spaceBetween: 24 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
            }}
            className="!overflow-visible jewelry-swiper"
          >
            {data.map((item) => (
              <SwiperSlide key={item._id}>
                <ProductCard key={item._id} data={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="text-center mt-12">
          <Link href="/category/shop-by-category">
            <Button
              size="lg"
              className="group relative rounded-full text-[15px] font-medium tracking-wider shadow-lg overflow-hidden"
            >
              <span className="relative flex items-center gap-2">
                VIEW MORE
                <Sparkles className="w-4 h-4" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Slider;
