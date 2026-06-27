"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import ProductCard from "@/components/comman/ProductCard";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const Slider = ({ data, heading, bg }: { data: any[]; heading: string; bg?: string }) => {
  return (
    <section className={`relative py-10 ${bg} overflow-hidden`} id={heading}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-[#8B4513] rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-2 border-[#8B4513] rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-[#8B4513] to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-gradient-to-tl from-[#8B4513] to-transparent rounded-full blur-2xl"></div>
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white/50 to-transparent z-20 pointer-events-none hidden md:block"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/50 to-transparent z-20 pointer-events-none hidden md:block"></div>
      <div className="max-w-7xl w-full overflow-x-hidden mx-auto px-4 relative z-10">
        {/* Enhanced Section Heading */}
        <div className="text-center mb-14 animate-fadeIn">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-[#8B4513] animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-serif text-[#8B4513] tracking-wide">
              {heading}
            </h2>
            <Sparkles className="w-5 h-5 text-[#8B4513] animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-[#8B4513]"></div>
            <div className="w-8 h-1.5 bg-[#8B4513] rounded-full shadow-lg shadow-[#8B4513]/30"></div>
            <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-[#8B4513]"></div>
          </div>
        </div>

        {/* Enhanced Swiper Slider */}
        <div className="py-8 relative">
          {/* Gradient Overlays for Edge Fade Effect */}

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
              320: {
                slidesPerView: 1.3,
                spaceBetween: 20,
              },
              450: {
                slidesPerView: 1.5,
                spaceBetween: 15,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className="!overflow-visible jewelry-swiper"
          >
            {data?.map((item, index) => (
              <SwiperSlide
                key={item._id}
                className="transition-all duration-500 hover:scale-105"
              >
                <div
                  className="animate-slideUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard key={item._id} data={item} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Enhanced View More Button */}
        <div className="text-center mt-12">
          <Link href="/category/shop-by-category">
            <button className="group relative bg-gradient-to-r from-[#8B4513] to-[#a05d2b] hover:from-[#a05d2b] hover:to-[#8B4513] text-white px-10 py-4 rounded-full text-[15px] font-medium tracking-wider transition-all duration-500 shadow-lg  hover:shadow-[#8B4513]/40 transform hover:-translate-y-1 overflow-hidden">
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></span>
              <span className="relative flex items-center gap-2 justify-center">
                VIEW MORE
                <Sparkles className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </span>
              <div className="absolute inset-0 rounded-full ring-2 ring-[#8B4513]/0 group-hover:ring-[#8B4513]/50 transition-all duration-500 group-hover:scale-105"></div>
            </button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .jewelry-swiper {
          padding: 20px 0;
        }

        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </section>
  );
};

export default Slider;
