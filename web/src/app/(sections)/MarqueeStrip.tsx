const ITEMS = [
  "Within 3 Days",
  "Pure Gold Jewellery",
  "Timeless Craftsmanship",
  "Made for Every Moment",
  "Elegance in Every Detail",
];

/**
 * Thin marquee strip under the hero. Duplicated content keeps the loop seamless
 * (the track translates -50%), and the animation pauses on hover.
 */
export default function MarqueeStrip() {
  const row = [...ITEMS, ...ITEMS];

  return (
    <div className="w-full overflow-hidden border-y border-[var(--brand-gold)]/20 bg-white py-3.5">
      <div className="marquee-track items-center">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-5 px-6 text-[11px] uppercase tracking-[0.28em] text-[var(--brand-ink)]/80 sm:text-xs"
          >
            <span className="text-[var(--brand-gold)]">✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
