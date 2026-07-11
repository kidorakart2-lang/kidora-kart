"use client";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const GiftItems = () => {
  const products = [
    {
      id: 1,
      img: "/images/image1.jpg",
      name: "Silver Gift Box",
      price: "₹499",
      oldPrice: "₹699",
    },
    {
      id: 2,
      img: "/images/image2.jpg",
      name: "Heart Pendant",
      price: "₹799",
      oldPrice: "₹999",
    },
    {
      id: 3,
      img: "/images/image3.jpg",
      name: "Couple Bracelet",
      price: "₹999",
      oldPrice: "₹1,299",
    },
    {
      id: 4,
      img: "/images/image4.jpg",
      name: "Love Ring Set",
      price: "₹1,199",
      oldPrice: "₹1,499",
    },
    {
      id: 5,
      img: "/images/image5.jpg",
      name: "Designer Watch",
      price: "₹1,499",
      oldPrice: "₹1,899",
    },
    {
      id: 6,
      img: "/images/image1.jpg",
      name: "Customized Keychain",
      price: "₹599",
      oldPrice: "₹799",
    },
    {
      id: 7,
      img: "/images/image2.jpg",
      name: "Golden Rose",
      price: "₹899",
      oldPrice: "₹1,099",
    },
    {
      id: 8,
      img: "/images/image3.jpg",
      name: "Teddy & Mug Combo",
      price: "₹699",
      oldPrice: "₹899",
    },
  ];

  return (
    <section
      className="py-12 bg-section"
      id="gift-items"
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <div className="max-w-[1300px] w-full overflow-x-hidden mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="section-heading mb-3">
            Perfect Gift Collection
          </h2>
          <div className="w-20 h-1 bg-brand-800 mx-auto rounded-full"></div>
          <p className="text-muted-foreground mt-3 text-[15px] fw-body">
            Thoughtful gifts for your loved ones
          </p>
        </div>

        {/* Slider */}
        <div className="py-5">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={700}
            loop={true}
            observer={true}
            observeParents={true}
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 20,
              },
              450: {
                slidesPerView: 1.8,
                spaceBetween: 15,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
            }}
            className="!overflow-visible"
          >
            {products.map((item) => (
              <SwiperSlide key={item.id}>
               <div className=""></div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* View More Button */}
        <div className="text-center mt-10">
          <button className="bg-brand-800 hover:bg-brand-700 text-background px-8 py-3 rounded-full text-[15px] transition-all duration-300">
            VIEW MORE
          </button>
        </div>
      </div>
    </section>
  );
};

export default GiftItems;
