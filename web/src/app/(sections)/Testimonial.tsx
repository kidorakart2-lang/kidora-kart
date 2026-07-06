"use client";
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import { Quote } from "lucide-react";

const Testimonial = ({ data }: { data: any[] | null | undefined }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className="text-lg"
        style={{ color: index < rating ? "var(--brand-primary)" : "var(--muted-foreground)" }}
      >
        ★
      </span>
    ));

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section
      className="relative mx-auto w-full  overflow-hidden py-10 lg:py-16 bg-section-subtle"
      itemScope
      itemType="https://schema.org/Review"
    >
      <div className="section-container relative z-10 max-w-5xl">
        <div className="text-center mb-12 lg:mb-16 ">
          <div className="inline-flex items-center gap-2 mb-4">
            <Quote className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            <span className="text-sm font-medium tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
              Customer Stories
            </span>
            <Quote className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
          </div>

          <h2 className="section-heading mb-4">
            What Our Customers Say
          </h2>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary))` }}
            />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }} />
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent"
              style={{ backgroundImage: `linear-gradient(to left, transparent, var(--brand-primary))` }}
            />
          </div>

          <p className="section-subheading">
            Real experiences from our valued customers who trust us with their precious moments
          </p>
        </div>

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
                <SwiperSlide key={t.id || index}>
                  <article
                    className="group relative bg-card text-card-foreground rounded-2xl shadow-lg p-8 flex flex-col h-full border overflow-hidden"
                    itemScope
                    itemType="https://schema.org/Review"
                  >
                    <div className="relative mb-6 flex justify-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
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
                    </div>

                    <blockquote className="flex-1 relative z-10 mb-6">
                      <p className="text-sm md:text-base leading-relaxed text-center font-light italic text-muted-foreground" itemProp="reviewBody">
                        &ldquo;{t.description}&rdquo;
                      </p>
                    </blockquote>

                    <div className="flex justify-center gap-1 mb-4 relative z-10">
                      {renderStars(t.rating)}
                    </div>

                    <figcaption className="text-center relative z-10">
                      <p className="font-semibold text-base md:text-lg mb-1" style={{ color: "var(--brand-heading)" }} itemProp="author">
                        {t.title}
                      </p>
                    </figcaption>

                    <p className="sr-only">Verified Customer</p>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          <div className="flex justify-center gap-4 mt-12">
            <button
              className="swiper-button-prev static w-12 h-12 rounded-full bg-card border-2 transition-colors duration-300 flex items-center justify-center after:content-none"
              style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="swiper-button-next static w-12 h-12 rounded-full bg-card border-2 transition-colors duration-300 flex items-center justify-center after:content-none"
              style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
