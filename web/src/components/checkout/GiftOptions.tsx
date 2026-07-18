"use client";

interface GiftOptionsProps {
  isGift: boolean;
  giftMessage: string;
  giftWrap: boolean;
  onGiftChange: (v: boolean) => void;
  onMessageChange: (v: string) => void;
  onWrapChange: (v: boolean) => void;
}

export default function GiftOptions({ isGift, giftMessage, giftWrap, onGiftChange, onMessageChange, onWrapChange }: GiftOptionsProps) {
  return (
    <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-7">
        <span className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">2</span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Gift Options</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Make your order extra special</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="flex items-center h-5 mt-0.5">
          <input id="is-gift" type="checkbox" checked={isGift} onChange={(e) => onGiftChange(e.target.checked)}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-border rounded" />
        </div>
        <div className="flex-1">
          <label htmlFor="is-gift" className="text-sm font-medium text-muted-foreground">This is a gift</label>
          <p className="text-xs text-muted-foreground mt-0.5">Add a gift message and gift wrap to your order</p>

          {isGift && (
            <div className="mt-4 space-y-4 pl-1">
              <div>
                <label htmlFor="gift-message" className="block text-sm font-medium text-muted-foreground mb-1">Gift Message (Optional)</label>
                <textarea id="gift-message" rows={2} placeholder="Write a personal message..." value={giftMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm" />
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5 mt-0.5">
                  <input id="gift-wrap" type="checkbox" checked={giftWrap} onChange={(e) => onWrapChange(e.target.checked)}
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-border rounded" />
                </div>
                <div>
                  <label htmlFor="gift-wrap" className="text-sm font-medium text-muted-foreground">Add Gift Wrap (₹50)</label>
                  <p className="text-xs text-muted-foreground mt-0.5">Premium gift wrapping with a personalized message card</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
