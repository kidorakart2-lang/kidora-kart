import ProductCard from "../comman/ProductCard";
import { useRelatedProducts } from "@/lib/useRelatedProducts";
import { Skeleton } from "../ui/skeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export default function RelatedProducts({ id, subCategory, subSubCategory }: { id: string; subCategory: string[]; subSubCategory: string[] }) {
  const { data: relatedProducts = [], isLoading } = useRelatedProducts(subCategory, subSubCategory);

  if (relatedProducts.length === 0 && !isLoading) return null;

  return (
    <div className="overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h3 className="text-4xl sm:text-5xl py-3 font-extralight text-foreground mb-2 tracking-tight">
          You Might Also Love
        </h3>
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-brand-300" />
          <Sparkles size={16} className="text-brand-600" strokeWidth={1.5} />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-brand-300" />
        </div>
      </motion.div>
      <div className="">
        {isLoading ? (
          <div className=" grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} />
            ))}
          </div>
        ) : (
          <Swiper
            className="w-full max-w-[1200px] mx-auto !overflow-visible py-4"
            modules={[Autoplay]}
            slidesPerView={4}
            spaceBetween={10}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            breakpoints={{
              0: {
                slidesPerView: 1.7,
              },
              768: {
                slidesPerView: 4,
              },
              1024: {
                slidesPerView: 4,
              },
            }}
          >
            {relatedProducts.map((product) => (
              <SwiperSlide key={product._id}>
                <ProductCard key={product._id} data={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </div>
  );
}
