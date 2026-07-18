import Image from "next/image";
import { Star } from "lucide-react";
const reviews = [
  {
    id: "1",
    author: "Sophia Bennett",
    rating: 5,
    date: "1 month ago",
    comment:
      "Absolutely love this toy! The quality is fantastic, and it looks even more fun in person.",
    avatar: "/images/image1.jpg",
  },
  {
    id: "2",
    author: "Olivia Carter",
    rating: 4,
    date: "2 months ago",
    comment:
      "Great toy, perfect for hours of play. The colors are vibrant and my kids absolutely love it!",
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
            ? "fill-brand-400 text-brand-400"
            : "text-muted-foreground"
        }
      />
    ));
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      {/* Summary */}
      <div className="bg-background rounded-lg p-5 border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-3">
          Customer Reviews
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-foreground">
            {product.rating}
          </span>
          <div className="flex gap-1">{renderStars(product.rating)}</div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Based on {product.reviews} reviews
        </p>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars, i) => (
            <div
              key={stars}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="w-6">{stars}★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
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
            className="bg-background rounded-lg p-5 border border-border"
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
                  <p className="font-semibold text-foreground text-sm">
                    {review.author}
                  </p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
              <div className="flex gap-1">{renderStars(review.rating)}</div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
