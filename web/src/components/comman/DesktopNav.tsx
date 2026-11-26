"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  HelpCircle,
  Lock,
  RotateCcw,
  Truck,
  MapPin,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { CategoryItem, MenuItem } from "./header-types";

interface DesktopNavProps {
  categories: CategoryItem[];
}

const POLICY_ICONS: Record<string, typeof FileText> = {
  "terms-and-condition": FileText,
  "/terms-and-condition": FileText,
  faq: HelpCircle,
  "/faq": HelpCircle,
  "our-policy": Lock,
  "/our-policy": Lock,
  "order-track": Truck,
  "/order-track": Truck,
  "contact-us": MapPin,
  "/contact-us": MapPin,
};

const subcategoryHref = (catSlug: string, menuSlug: string) =>
  `/category/${catSlug}/${menuSlug}`;

export default function DesktopNav({ categories }: DesktopNavProps) {
  const router = useRouter();
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const [menuLeft, setMenuLeft] = useState(0);
  const [underlineStyle, setUnderlineStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const categoryEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navCategoriesRef = useRef<HTMLDivElement>(null);

  const handleCatEnter = useCallback(
    (idx: number) => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      setHoveredCat(idx);

      const el = categoryEls.current.get(idx);
      const nav = navCategoriesRef.current;
      if (!el || !nav) return;

      const btn = el.querySelector("button, a");
      if (!btn) return;

      const btnRect = btn.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      setUnderlineStyle({
        left: btnRect.left - navRect.left,
        width: btnRect.width,
      });

      const isPages = categories[idx]?.slug === "pages";
      const panelWidth = isPages ? 300 : Math.min(1040, window.innerWidth - 48);
      let left = btnRect.left - navRect.left - 40;
      const overflow = navRect.left + left + panelWidth - (window.innerWidth - 16);
      if (overflow > 0) left = Math.max(0, left - overflow);
      if (left < -navRect.left + 16) left = -navRect.left + 16;
      setMenuLeft(left);
    },
    [categories],
  );

  const handleCatLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setHoveredCat(null), 140);
  }, []);

  const active = hoveredCat !== null ? categories[hoveredCat] : null;
  const isPages = active?.slug === "pages";
  const curated = active?.subCategories?.[0];
  // With sparse menus (one sub-category and no sub-sub-categories) the rail
  // would be an empty column, so only render it when it has something to show.
  const showCurated =
    !!curated &&
    ((curated.subSubCategories?.length ?? 0) > 0 ||
      (active?.subCategories?.length ?? 0) > 1);

  return (
    <nav className="hidden lg:flex items-center justify-center">
      <div
        className="relative flex items-center gap-1"
        onMouseEnter={() => {
          if (leaveTimer.current) clearTimeout(leaveTimer.current);
        }}
        onMouseLeave={handleCatLeave}
        ref={navCategoriesRef}
      >
        {categories?.map((cat, idx) => {
          const hasMenu = (cat.subCategories?.length ?? 0) > 0;
          const isActive = hoveredCat === idx;

          return (
            <div
              key={idx}
              ref={(el) => {
                if (el) categoryEls.current.set(idx, el);
              }}
              onMouseEnter={() => hasMenu && handleCatEnter(idx)}
            >
              {hasMenu ? (
                <button
                  onClick={() => router.push(urlPrefix(cat.slug))}
                  className={`relative inline-flex items-center gap-1 px-4 py-2.5 text-[12.5px] tracking-[0.02em] transition-colors ${
                    isActive
                      ? "text-[var(--brand-plum)]"
                      : "text-[var(--brand-ink)]/70 hover:text-[var(--brand-plum)]"
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={isActive}
                >
                  {cat.name}
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      isActive ? "rotate-180" : ""
                    }`}
                  />
                </button>
              ) : (
                <Link
                  href={urlPrefix(cat.slug)}
                  className="relative inline-flex items-center gap-1 px-4 py-2.5 text-[12.5px] tracking-[0.02em] text-[var(--brand-ink)]/70 transition-colors hover:text-[var(--brand-plum)]"
                >
                  {cat.name}
                </Link>
              )}
            </div>
          );
        })}

        <span
          className="pointer-events-none absolute bottom-[3px] z-[1000] h-[2px] bg-[var(--brand-gold-dark)] transition-all duration-300"
          style={{
            left: `${underlineStyle.left}px`,
            width: `${underlineStyle.width}px`,
            opacity: hoveredCat !== null ? 1 : 0,
          }}
        />

        <div
          className={`absolute top-full z-[999] pt-3 transition-all duration-300 ${
            hoveredCat !== null
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
          style={{ left: `${menuLeft}px` }}
          onMouseEnter={() => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current);
          }}
          onMouseLeave={handleCatLeave}
        >
          {active && isPages && (
            <div className="w-[300px] overflow-hidden rounded-xl border border-[var(--brand-gold)]/30 bg-white shadow-[0_24px_60px_-30px_rgba(75,49,71,0.45)]">
              <ul className="p-2.5">
                {active.subCategories.map((item, i) => {
                  const Icon = POLICY_ICONS[item.slug] ?? FileText;
                  return (
                    <li key={i}>
                      <Link
                        href={item.slug}
                        className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-[var(--brand-rose)]/25"
                      >
                        <span className="grid size-9 place-items-center rounded-md border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 text-[var(--brand-gold-dark)]">
                          <Icon size={15} />
                        </span>
                        <span className="text-[13.5px] text-[var(--brand-ink)]">
                          {item.name}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {active && !isPages && (
            <div
              className={`overflow-hidden rounded-xl border border-[var(--brand-gold)]/30 bg-white shadow-[0_30px_80px_-42px_rgba(75,49,71,0.5)] ${
                showCurated
                  ? "w-[min(1040px,calc(100vw-40px))]"
                  : "w-[min(700px,calc(100vw-40px))]"
              }`}
            >
              <div className={showCurated ? "grid grid-cols-[1fr_300px]" : "grid grid-cols-1"}>
                {/* Collection tiles */}
                <div className="p-6 sm:p-7">
                  <p className="text-[9.5px] uppercase tracking-[0.28em] text-[var(--brand-gold-dark)]">
                    Explore collections
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-4 border-b border-[var(--brand-gold)]/25 pb-4">
                    <h3 className="display-heading text-2xl">{active.name}</h3>
                    <Link
                      href={`/category/${active.slug}`}
                      className="btn-gold !px-4 !py-2 !text-[11px]"
                    >
                      View All
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div className="custom-scrollbar-thin mt-4 grid max-h-[420px] grid-cols-2 gap-2.5 overflow-y-auto pr-1">
                    {active.subCategories.map((menu: MenuItem, i) => (
                      <Link
                        key={menu._id ?? i}
                        href={subcategoryHref(active.slug, menu.slug)}
                        className="group/tile flex items-center gap-3 rounded-lg border border-[var(--brand-gold)]/20 bg-white px-3 py-2.5 transition-all hover:border-[var(--brand-gold)]/60 hover:bg-[var(--brand-cream)]"
                      >
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-[var(--brand-gold)]/15 bg-[var(--brand-cream)]">
                          {menu.image ? (
                            <Image
                              src={menu.image}
                              alt={menu.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-[10px] text-[var(--brand-mauve)]">
                              ✦
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-[13.5px] text-[var(--brand-ink)]">
                          {menu.name}
                        </span>
                        <ChevronRight
                          size={14}
                          className="shrink-0 text-[var(--brand-mauve)] transition-transform group-hover/tile:translate-x-0.5"
                        />
                      </Link>
                    ))}
                  </div>

                  {active.image && (
                    <Link
                      href={`/category/${active.slug}`}
                      className="group/img relative mt-4 block h-20 overflow-hidden rounded-lg border border-[var(--brand-gold)]/20"
                    >
                      <Image
                        src={active.image}
                        alt={active.name}
                        fill
                        sizes="600px"
                        className="object-cover transition-transform duration-500 group-hover/img:scale-[1.04]"
                      />
                      <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,26,39,0.92)_0%,rgba(75,49,71,0.62)_52%,rgba(75,49,71,0.05)_100%)]" />
                      <span className="absolute inset-y-0 left-4 flex flex-col justify-center gap-0.5 text-[var(--brand-cream)]">
                        <span className="text-[8.5px] uppercase tracking-[0.22em] text-[var(--brand-cream)]/70">
                          Shop the edit
                        </span>
                        <span className="display-heading text-lg !text-[var(--brand-cream)]">
                          {active.name}
                        </span>
                      </span>
                    </Link>
                  )}
                </div>

                {/* Curated edit rail */}
                {showCurated && curated && (
                  <div className="border-l border-[var(--brand-gold)]/25 bg-[var(--brand-rose)]/20 p-6">
                    <p className="text-[9.5px] uppercase tracking-[0.28em] text-[var(--brand-gold-dark)]">
                      Curated edit
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2 border-b border-[var(--brand-gold)]/25 pb-3">
                      <h4 className="display-heading text-lg leading-tight">
                        {curated.name}
                      </h4>
                      <Link
                        href={subcategoryHref(active.slug, curated.slug)}
                        aria-label={`View all ${curated.name}`}
                      >
                        <ArrowRight
                          size={16}
                          className="text-[var(--brand-ink)]/70 transition-transform hover:translate-x-0.5"
                        />
                      </Link>
                    </div>

                    <ul className="mt-3 max-h-[360px] space-y-0.5 overflow-y-auto custom-scrollbar-thin pr-1">
                      {(curated.subSubCategories.length > 0
                        ? curated.subSubCategories
                        : active.subCategories.slice(1)
                      ).map((item, i) => {
                        const href =
                          "subSubCategories" in item
                            ? `${subcategoryHref(active.slug, curated.slug)}/${item.slug}`
                            : subcategoryHref(active.slug, item.slug);
                        return (
                          <li key={item._id ?? i}>
                            <Link
                              href={href}
                              className="flex items-center gap-3 rounded-md px-2 py-2 text-[13px] text-[var(--brand-ink)]/80 transition-colors hover:bg-white hover:text-[var(--brand-plum)]"
                            >
                              <span className="size-1.5 shrink-0 rounded-full bg-[var(--brand-gold)]" />
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    <Link
                      href={subcategoryHref(active.slug, curated.slug)}
                      className="mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--brand-gold-dark)] hover:text-[var(--brand-plum)]"
                    >
                      Explore all
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const urlPrefix = (slug: string) => {
  if (slug === "home") return "/";
  if (slug === "track-your-order") return "/order-track";
  if (slug === "contact-us") return "/contact-us";
  return "/category/" + slug;
};
