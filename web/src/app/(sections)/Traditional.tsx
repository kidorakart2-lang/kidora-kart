"use client";

import Image from "next/image";
import { motion } from 'framer-motion';
import { Playfair_Display, Montserrat } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

const TraditionalJewellery = () => {
  const items = [
    {
      id: 1,
      title: "Bridal Choker",
      subtitle: "Traditional",
      img: "/images/bridal-chokar.jpg",
    },
    {
      id: 2,
      title: "Bangles",
      subtitle: "Royalty",
      img: "/images/bangles.jpg",
    },
    {
      id: 3,
      title: "Earring",
      subtitle: "Temple",
      img: "/images/earring.jpg",
    },
    {
      id: 4,
      title: "Rings",
      subtitle: "Exquisite",
      img: "/images/ring.jpg",
    },
  ];

  return (
    <section className={`py-16 bg-white ${montserrat.className}`} aria-label="Traditional Jewellery">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 px-4"
      >
        <h2 className={`${playfair.variable} font-playfair text-3xl md:text-4xl font-bold text-gray-900 tracking-wide relative inline-block`}>
          Traditional Jewellery
          <span className="absolute left-0 right-0 h-1 bg-amber-500 w-24 mx-auto bottom-[-10px] rounded-full"></span>
        </h2>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Discover our exquisite collection of handcrafted traditional jewellery, blending timeless elegance with modern craftsmanship.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="relative group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl shadow-lg bg-white">
              {/* Image Container */}
              <div className="overflow-hidden h-80 md:h-96">
                <Image
                  src={item.img}
                  alt={`${item.title} Jewellery`}
                  width={400}
                  height={500}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-amber-300 text-sm font-medium tracking-wider mb-1 block">
                    {item.subtitle}
                  </span>
                  <h3 className="text-white text-xl font-semibold mb-3">
                    {item.title}
                  </h3>
                  <button className="text-white text-sm font-medium border-b border-transparent hover:border-white transition-all duration-300">
                    Explore Collection →
                  </button>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <span className="text-xs font-medium text-gray-800">New Arrival</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TraditionalJewellery;
