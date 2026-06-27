"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, EffectCards } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-cards";
import Image from "next/image";
import { Quote, Sparkles } from "lucide-react";

const Testimonial = ({ data, bg }: { data: any[]; bg?: string }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg transition-all duration-300 ${
          index < rating ? "text-amber-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));

  return (
    <section
      className={`relative mx-auto w-full overflow-hidden py-10 lg:py-16 ${bg}`}
      itemScope
      itemType="https://schema.org/Review"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Quote Marks */}
      <div className="absolute top-10 left-10 opacity-5">
        <Quote className="w-32 h-32 text-amber-600 transform rotate-12" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-5">
        <Quote className="w-32 h-32 text-amber-600 transform -rotate-12 scale-x-[-1]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
            <span className="text-sm font-medium text-slate-600 tracking-wider uppercase">
              Customer Stories
            </span>
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-slate-800 mb-4 tracking-wide">
            What Our Customers Say
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-600"></div>
            <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-600"></div>
          </div>

          <p className="text-slate-600 text-sm md:text-base lg:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Real experiences from our valued customers who trust us with their precious moments
          </p>
        </div>

        {/* Testimonials Slider */}
        <div className="py-8">
          {isMounted && (
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={32}
              slidesPerView={1}
              navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              speed={800}
              loop={true}
              observer={true}
              observeParents={true}
              breakpoints={{
                768: {
                  slidesPerView: 2,
                  spaceBetween: 24,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 32,
                },
              }}
              className="!overflow-visible testimonial-swiper"
            >
              {data.map((t, index) => (
                <SwiperSlide key={t.id}>
                  <article
                    className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl 
                               transition-all duration-500 hover:-translate-y-2 p-8 flex flex-col h-full
                               border border-slate-100 overflow-hidden"
                    itemScope
                    itemType="https://schema.org/Review"
                  >
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 via-transparent to-transparent 
                                    group-hover:from-amber-50/50 transition-all duration-500 rounded-2xl"></div>

                    {/* Quote Icon */}
                    <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                      <Quote className="w-16 h-16 text-amber-600" />
                    </div>

                    {/* Avatar */}
                    <div className="relative mb-6 flex justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg 
                                      group-hover:scale-110 transition-transform duration-500 relative z-10">
                          <Image
                            width={80}
                            height={80}
                            loading="lazy"
                            src={t.image}
                            alt={`Customer ${t.title}`}
                            className="w-full h-full object-cover"
                            itemProp="image"
                          />
                        </div>
                        {/* Ring Effect */}
                        <div className="absolute inset-0 rounded-full ring-4 ring-amber-200/0 
                                      group-hover:ring-amber-200/50 transition-all duration-500 
                                      group-hover:scale-125"></div>
                      </div>
                    </div>

                    {/* Review Text */}
                    <blockquote className="flex-1 relative z-10 mb-6">
                      <p
                        className="text-slate-600 text-sm md:text-base leading-relaxed text-center font-light italic"
                        itemProp="reviewBody"
                      >
                        "{t.description}"
                      </p>
                    </blockquote>

                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-4 relative z-10">
                      {renderStars(t.rating)}
                    </div>

                    {/* Name */}
                    <figcaption className="text-center relative z-10">
                      <p
                        className="font-semibold text-slate-800 text-base md:text-lg mb-1"
                        itemProp="author"
                      >
                        {t.title}
                      </p>
                      <div className="w-12 h-0.5 bg-amber-400 mx-auto rounded-full opacity-0 
                                    group-hover:opacity-100 transition-all duration-500"></div>
                    </figcaption>

                    <p className="sr-only">Verified Customer</p>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* Custom Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-12">
            <button className="swiper-button-prev static w-12 h-12 rounded-full bg-white border-2 border-amber-500 
                             text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300 
                             shadow-md hover:shadow-lg flex items-center justify-center after:content-none
                             transform hover:scale-110">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="swiper-button-next static w-12 h-12 rounded-full bg-white border-2 border-amber-500 
                             text-amber-600 hover:bg-amber-500 hover:text-white transition-all duration-300 
                             shadow-md hover:shadow-lg flex items-center justify-center after:content-none
                             transform hover:scale-110">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;