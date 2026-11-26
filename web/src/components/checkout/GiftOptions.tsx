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
    <div className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">2</span>
        <div>
          <h2 className="display-heading text-lg">Gift Options</h2>
          <p className="mt-0.5 text-[11px] text-[var(--brand-ink)]/50">Make your order extra special</p>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <div className="mt-0.5 flex h-5 items-center">
          <input id="is-gift" type="checkbox" checked={isGift} onChange={(e) => onGiftChange(e.target.checked)}
            className="size-4 rounded border-[var(--brand-gold)]/40 text-[var(--brand-mauve)] accent-[var(--brand-mauve)] focus:ring-[var(--brand-gold)]/40" />
        </div>
        <div className="flex-1">
          <label htmlFor="is-gift" className="text-sm text-[var(--brand-ink)]">This is a gift</label>
          <p className="mt-0.5 text-[11.5px] text-[var(--brand-ink)]/50">Add a gift message and gift wrap to your order</p>

          {isGift && (
            <div className="mt-4 space-y-4 pl-1">
              <div>
                <label htmlFor="gift-message" className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">Gift Message (Optional)</label>
                <textarea id="gift-message" rows={2} placeholder="Write a personal message..." value={giftMessage}
                  onChange={(e) => onMessageChange(e.target.value)}
                  className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-3 py-2 text-sm text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30" />
              </div>
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 flex h-5 items-center">
                  <input id="gift-wrap" type="checkbox" checked={giftWrap} onChange={(e) => onWrapChange(e.target.checked)}
                    className="size-4 rounded border-[var(--brand-gold)]/40 text-[var(--brand-mauve)] accent-[var(--brand-mauve)] focus:ring-[var(--brand-gold)]/40" />
                </div>
                <div>
                  <label htmlFor="gift-wrap" className="text-sm text-[var(--brand-ink)]">Add Gift Wrap (₹50)</label>
                  <p className="mt-0.5 text-[11.5px] text-[var(--brand-ink)]/50">Premium gift wrapping with a personalized message card</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
