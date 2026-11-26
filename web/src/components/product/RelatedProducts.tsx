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
    <div className="overflow-x-hidden py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <p className="eyebrow mb-2">
          <span className="mr-2">✦</span>
          Complete the look
        </p>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--brand-gold)]/25 pb-4">
          <h3 className="display-heading text-2xl sm:text-3xl lg:text-4xl">
            Similar Products
          </h3>
          <div className="flex items-center gap-2 text-[var(--brand-plum)]">
            <span className="grid size-9 place-items-center rounded-full border border-[var(--brand-gold)]/40">
              <Sparkles size={13} />
            </span>
          </div>
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
            className="mx-auto w-full max-w-7xl !overflow-visible px-4 !py-4 sm:px-6 lg:px-8"
            modules={[Autoplay]}
            slidesPerView={4}
            spaceBetween={18}
            autoplay={{
              delay: 3800,
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
