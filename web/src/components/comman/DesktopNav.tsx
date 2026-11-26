"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  FileText,
  HelpCircle,
  Lock,
  MapPin,
  Truck,
} from "lucide-react";
import type { CategoryItem } from "./header-types";

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

const subSubcategoryHref = (
  catSlug: string,
  menuSlug: string,
  subSlug: string,
) => `/category/${catSlug}/${menuSlug}/${subSlug}`;

export default function DesktopNav({ categories }: DesktopNavProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const closeMenu = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setActiveIdx(null);
  }, []);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setActiveIdx(null), 160);
  }, []);

  const handleCatEnter = useCallback(
    (idx: number) => {
      clearCloseTimer();
      // Once a panel is open, moving across the nav should swap it
      // immediately. The first open waits briefly so a passing pointer
      // does not flash a menu.
      if (activeIdx !== null) {
        clearOpenTimer();
        setActiveIdx(idx);
        return;
      }
      clearOpenTimer();
      openTimer.current = setTimeout(() => setActiveIdx(idx), 110);
    },
    [activeIdx],
  );

  const openMenu = (idx: number) => {
    clearOpenTimer();
    clearCloseTimer();
    setActiveIdx(idx);
  };

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (activeIdx === null) return;

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const previous = activeIdx;
      closeMenu();
      requestAnimationFrame(() => {
        buttonRefs.current.get(previous)?.focus();
      });
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeIdx, closeMenu]);

  const active = activeIdx !== null ? categories[activeIdx] : null;
  const isPages = active?.slug === "pages";
  const subCategories = active?.subCategories ?? [];
  const hasGrandchildren = subCategories.some(
    (sub) => (sub.subSubCategories?.length ?? 0) > 0,
  );
  // Categories with only one or two leaf links should not open a wide
  // panel full of empty columns.
  const isSparse =
    !!active && !isPages && subCategories.length <= 2 && !hasGrandchildren;
  const portrait =
    active?.image || subCategories.find((sub) => sub.image)?.image;

  const railCategories = categories
    .map((cat, idx) => ({ cat, idx }))
    .filter(({ cat }) => cat.slug !== "pages");

  return (
    <nav
      ref={rootRef}
      className="relative hidden items-center justify-center lg:flex"
      aria-label="Categories"
      onMouseLeave={scheduleClose}
    >
      <div className="flex items-center gap-1">
        {categories.map((cat, idx) => {
          const hasMenu = (cat.subCategories?.length ?? 0) > 0;
          const isActive = activeIdx === idx;

          return (
            <div
              key={cat.slug || idx}
              onMouseEnter={() => {
                if (hasMenu) handleCatEnter(idx);
                else setActiveIdx(null);
              }}
            >
              {hasMenu ? (
                <button
                  ref={(el) => {
                    if (el) buttonRefs.current.set(idx, el);
                  }}
                  type="button"
                  onClick={() => openMenu(idx)}
                  className={`relative inline-flex items-center gap-1 px-4 py-2.5 text-[12.5px] tracking-[0.02em] transition-colors ${
                    isActive
                      ? "text-[var(--brand-plum)]"
                      : "text-[var(--brand-ink)]/70 hover:text-[var(--brand-plum)]"
                  }`}
                  aria-haspopup="true"
                  aria-expanded={isActive}
                  aria-controls="mega-menu-panel"
                >
                  {cat.name}
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      isActive ? "rotate-180" : ""
                    }`}
                  />
                  <span
                    className={`absolute inset-x-3 bottom-[3px] h-px origin-left bg-[var(--brand-gold-dark)] transition-transform duration-300 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              ) : (
                <Link
                  href={urlPrefix(cat.slug)}
                  className="relative inline-flex items-center px-4 py-2.5 text-[12.5px] tracking-[0.02em] text-[var(--brand-ink)]/70 transition-colors hover:text-[var(--brand-plum)]"
                >
                  {cat.name}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {active && (
        <div
          id="mega-menu-panel"
          className={`absolute left-1/2 top-full z-[300] -translate-x-1/2 animate-in fade-in slide-in-from-top-1 duration-200 ${
            isPages
              ? "mt-2 w-[min(560px,calc(100vw-2rem))]"
                                : isSparse
                    ? "mt-2 w-[min(620px,calc(100vw-2rem))]"
                    : "w-screen"
          }`}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          {isPages ? (
            <div className="overflow-hidden rounded-[4px] border border-[var(--brand-gold)]/30 bg-[var(--brand-cream)] p-5 shadow-[0_24px_50px_-30px_rgba(74,37,66,0.4)]">
              <PagesPanel items={subCategories} onNavigate={closeMenu} />
            </div>
          ) : isSparse ? (
            <div className="overflow-hidden rounded-[4px] border border-[var(--brand-gold)]/30 bg-[var(--brand-cream)] p-5 shadow-[0_24px_50px_-30px_rgba(74,37,66,0.4)]">
              <CompactPanel
                category={active}
                portrait={portrait}
                onNavigate={closeMenu}
              />
            </div>
          ) : (
            <div className="border-t border-[var(--brand-gold)]/25 bg-[var(--brand-cream)] shadow-[0_28px_60px_-36px_rgba(74,37,66,0.45)]">
              <EditorialPanel
                active={active}
                activeIdx={activeIdx!}
                railCategories={railCategories}
                portrait={portrait}
                onHoverCategory={setActiveIdx}
                onNavigate={closeMenu}
              />
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function EditorialPanel({
  active,
  activeIdx,
  railCategories,
  portrait,
  onHoverCategory,
  onNavigate,
}: {
  active: CategoryItem;
  activeIdx: number;
  railCategories: { cat: CategoryItem; idx: number }[];
  portrait?: string;
  onHoverCategory: (idx: number) => void;
  onNavigate: () => void;
}) {
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[168px_minmax(0,1fr)] gap-8 px-6 py-7 xl:grid-cols-[196px_minmax(0,1fr)_292px]">
      <aside className="border-r border-[var(--brand-gold)]/25 pr-5">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--brand-gold-dark)]">
          Collections
        </p>
        <ul className="mt-3 space-y-0.5">
          {railCategories.map(({ cat, idx }) => {
            const isCurrent = idx === activeIdx;
            return (
              <li key={cat.slug}>
                <Link
                  href={urlPrefix(cat.slug)}
                  onMouseEnter={() => onHoverCategory(idx)}
                  onClick={onNavigate}
                  className={`group flex items-center gap-2.5 py-1.5 text-[12px] tracking-[0.04em] transition-colors ${
                    isCurrent
                      ? "text-[var(--brand-plum)]"
                      : "text-[var(--brand-ink)]/60 hover:text-[var(--brand-plum)]"
                  }`}
                >
                  <span
                    className={`h-px shrink-0 bg-[var(--brand-gold-dark)] transition-all duration-200 ${
                      isCurrent ? "w-4" : "w-0 group-hover:w-2"
                    }`}
                  />
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="custom-scrollbar-thin max-h-[352px] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-x-9 gap-y-6 xl:grid-cols-3">
          {active.subCategories.map((sub, subIdx) => (
            <div key={sub._id ?? `${sub.slug}-${subIdx}`}>
              <Link
                href={subcategoryHref(active.slug, sub.slug)}
                onClick={onNavigate}
                className="group flex items-center justify-between gap-2 border-b border-[var(--brand-gold)]/25 pb-1.5 text-[12.5px] font-medium text-[var(--brand-plum)]"
              >
                <span>{sub.name}</span>
                <ArrowUpRight
                  size={13}
                  className="shrink-0 -translate-x-0.5 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                />
              </Link>
              {sub.subSubCategories.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {sub.subSubCategories.slice(0, 6).map((child, childIdx) => (
                    <li key={child._id ?? `${child.slug}-${childIdx}`}>
                      <Link
                        href={subSubcategoryHref(
                          active.slug,
                          sub.slug,
                          child.slug,
                        )}
                        onClick={onNavigate}
                        className="text-[12.5px] leading-relaxed text-[var(--brand-ink)]/65 transition-colors hover:text-[var(--brand-plum)]"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                  {sub.subSubCategories.length > 6 && (
                    <li>
                      <Link
                        href={subcategoryHref(active.slug, sub.slug)}
                        onClick={onNavigate}
                        className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-gold-dark)] hover:text-[var(--brand-plum)]"
                      >
                        +{sub.subSubCategories.length - 6} more
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <aside className="hidden xl:block">
        <Link
          href={urlPrefix(active.slug)}
          onClick={onNavigate}
          className="group relative block h-[292px] overflow-hidden rounded-[3px] bg-[var(--brand-surface)]"
        >
          {portrait ? (
            <Image
              src={portrait}
              alt={active.name}
              fill
              sizes="292px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <span className="paisley-field absolute inset-0 grid place-items-center bg-[var(--brand-rose)]/40">
              <span className="display-heading text-2xl text-[var(--brand-plum)]/35">
                Ratnavya
              </span>
            </span>
          )}
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,19,38,0.02)_25%,rgba(42,19,38,0.82)_100%)]" />
          <span className="absolute inset-x-5 bottom-5 text-[var(--brand-cream)]">
            <span className="block text-[8.5px] uppercase tracking-[0.28em] text-[var(--brand-cream)]/65">
              The edit
            </span>
            <span className="mt-1 block font-display text-2xl leading-tight">
              {active.name}
            </span>
            <span className="mt-2.5 inline-flex items-center gap-1.5 border-b border-[var(--brand-gold)]/50 pb-0.5 text-[9px] uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              Discover
              <ArrowRight
                size={11}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </span>
        </Link>
      </aside>
    </div>
  );
}

function CompactPanel({
  category,
  portrait,
  onNavigate,
}: {
  category: CategoryItem;
  portrait?: string;
  onNavigate: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_188px] gap-5">
      <div>
        <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--brand-gold-dark)]">
          Explore the collection
        </p>
        <ul className="mt-3 space-y-2">
          {category.subCategories.map((sub) => (
            <li key={sub._id ?? sub.slug}>
              <Link
                href={subcategoryHref(category.slug, sub.slug)}
                onClick={onNavigate}
                className="group flex items-center gap-3 rounded-[3px] border border-[var(--brand-gold)]/20 p-2 transition-colors hover:border-[var(--brand-gold)]/50 hover:bg-[var(--brand-rose)]/20"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-[2px] border border-[var(--brand-gold)]/15 bg-[var(--brand-rose)]/40">
                  {sub.image ? (
                    <Image
                      src={sub.image}
                      alt={sub.name}
                      fill
                      sizes="48px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] text-[var(--brand-gold-dark)]">
                      ✦
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-[var(--brand-plum)]">
                    {sub.name}
                  </span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                    Shop collection
                  </span>
                </span>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 text-[var(--brand-mauve)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={urlPrefix(category.slug)}
          onClick={onNavigate}
          className="mt-3 inline-flex items-center gap-1.5 border-b border-[var(--brand-gold)]/35 pb-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--brand-gold-dark)] transition-colors hover:text-[var(--brand-plum)]"
        >
          View all {category.name}
          <ArrowRight size={12} />
        </Link>
      </div>

      <Link
        href={urlPrefix(category.slug)}
        onClick={onNavigate}
        className="group relative block min-h-[188px] overflow-hidden rounded-[3px] bg-[var(--brand-surface)]"
      >
        {portrait ? (
          <Image
            src={portrait}
            alt={category.name}
            fill
            sizes="188px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="paisley-field absolute inset-0 grid place-items-center bg-[var(--brand-rose)]/40">
            <span className="display-heading text-xl text-[var(--brand-plum)]/35">
              Ratnavya
            </span>
          </span>
        )}
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,19,38,0.02)_25%,rgba(42,19,38,0.85)_100%)]" />
        <span className="absolute inset-x-4 bottom-4 text-[var(--brand-cream)]">
          <span className="block text-[8px] uppercase tracking-[0.26em] text-[var(--brand-cream)]/65">
            The edit
          </span>
          <span className="mt-1 block font-display text-xl leading-tight">
            {category.name}
          </span>
          <span className="mt-2 inline-flex items-center gap-1.5 border-b border-[var(--brand-gold)]/50 pb-0.5 text-[9px] uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Discover
            <ArrowRight
              size={10}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </span>
      </Link>
    </div>
  );
}

function PagesPanel({
  items,
  onNavigate,
}: {
  items: CategoryItem["subCategories"];
  onNavigate: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-8">
        {items.map((item) => {
          const Icon = POLICY_ICONS[item.slug] ?? FileText;
          return (
            <Link
              key={item.slug}
              href={item.slug}
              onClick={onNavigate}
              className="group flex items-center gap-3 border-b border-[var(--brand-gold)]/20 py-2.5 text-[13px] text-[var(--brand-ink)]/80 transition-colors hover:text-[var(--brand-plum)]"
            >
              <Icon
                size={14}
                className="shrink-0 text-[var(--brand-gold-dark)]"
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const urlPrefix = (slug: string) => {
  if (slug === "home") return "/";
  if (slug === "track-your-order") return "/order-track";
  if (slug === "contact-us") return "/contact-us";
  return "/category/" + slug;
};
