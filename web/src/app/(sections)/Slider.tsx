"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import ProductCard from "@/components/comman/ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData } from "@/types";
import { getCategoryHref } from "@/lib/category-nav";

const Slider = ({ data, heading }: { data: any[] | null | undefined; heading: string }) => {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];
  const viewMoreHref = getCategoryHref(categories);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section className="relative py-10 overflow-hidden bg-section" id={heading}>
      <div className="section-container">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl fw-heading tracking-wide section-heading mb-4">
            {heading}
          </h2>
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
            className="!overflow-visible toys-swiper"
          >
            {data.map((item) => (
              <SwiperSlide key={item._id}>
                <ProductCard key={item._id} data={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="text-center mt-12">
          <Link href={viewMoreHref}>
            <Button
              variant="gradient"
              size="lg"
              className="group relative rounded-full text-[15px] font-medium tracking-wider shadow-lg overflow-hidden"
            >
              <span className="relative flex items-center gap-2">
                VIEW MORE
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Slider;
