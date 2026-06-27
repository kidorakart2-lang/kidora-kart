import type { ProductData } from "@/types";

export function BuyNowButton({ product, selectedColor }: { product: ProductData; selectedColor: { _id: string; name: string; code?: string } }) {
  const handleBuyNow = () => {
    const directPurchaseItem = {
      productId: product._id,
      colorId: selectedColor._id,
      quantity: 1,
      isPersonalized: false,
      personalizedName: null
    };

    // Store in sessionStorage and redirect to checkout
    sessionStorage.setItem('directPurchase', JSON.stringify([directPurchaseItem]));
    window.location.href = '/checkout?type=direct';
  };

  return (
    <button onClick={handleBuyNow}>
      Buy Now
    </button>
  );
}