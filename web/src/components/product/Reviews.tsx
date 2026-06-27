import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
const reviews = [
  {
    id: "1",
    author: "Sophia Bennett",
    rating: 5,
    date: "1 month ago",
    comment:
      "Absolutely stunning pendant! The craftsmanship is impeccable, and it looks even more beautiful in person.",
    avatar: "/images/image1.jpg",
  },
  {
    id: "2",
    author: "Olivia Carter",
    rating: 4,
    date: "2 months ago",
    comment:
      "Lovely pendant, perfect for everyday wear. The diamond sparkles beautifully, though I wish it came with a longer chain.",
    avatar: "/images/image2.jpg",
  },
];

interface ReviewsProduct {
  rating: number;
  reviews: number;
}

export default function Reviews({ product }: { product: ReviewsProduct }) {
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={
          i < Math.floor(rating || 4)
            ? "fill-amber-400 text-amber-400"
            : "text-gray-300"
        }
      />
    ));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      {/* Summary */}
      <div className="bg-white rounded-lg p-5 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Customer Reviews
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-gray-900">
            {product.rating}
          </span>
          <div className="flex gap-1">{renderStars(product.rating)}</div>
        </div>
        <p className="text-xs text-gray-600 mb-4">
          Based on {product.reviews} reviews
        </p>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars, i) => (
            <div
              key={stars}
              className="flex items-center gap-2 text-xs text-gray-600"
            >
              <span className="w-6">{stars}★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${[70, 20, 5, 3, 2][i]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Reviews */}
      <div className="lg:col-span-2 space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg p-5 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <Image
                  src={review.avatar}
                  alt={review.author}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {review.author}
                  </p>
                  <p className="text-xs text-gray-500">{review.date}</p>
                </div>
              </div>
              <div className="flex gap-1">{renderStars(review.rating)}</div>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
