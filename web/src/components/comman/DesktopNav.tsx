"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CategoryItem, MenuItem } from "./header-types";

interface DesktopNavProps {
  categories: CategoryItem[];
}

export default function DesktopNav({ categories }: DesktopNavProps) {
  const router = useRouter();
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);
  const [gridCols, setGridCols] = useState(4);
  const [underlineStyle, setUnderlineStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const categoryEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navCategoriesRef = useRef<HTMLDivElement>(null);

  const handleCatEnter = useCallback((idx: number) => {
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
    const subCategories = categories[idx]?.subCategories ?? [];
    const subCount = subCategories.length;
    const colCount = isPages ? 1 : Math.min(Math.max(subCount, 1), 4);
    const w = isPages ? 280 : Math.min(32 + 212 * colCount, window.innerWidth - 32);
    setGridCols(colCount);
    setMenuWidth(w);
    let left = btnRect.left - navRect.left;
    const overflow = navRect.left + left + w - (window.innerWidth - 16);
    if (overflow > 0) left = Math.max(0, left - overflow);
    setMenuLeft(left);
  }, [categories]);

  const handleCatLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      setHoveredCat(null);
    }, 120);
  }, []);

  const pagesContent = (
    <div className="p-4 min-w-[200px]">
      <ul className="space-y-0.5">
        {categories.filter((_, i) => i === hoveredCat).length > 0 &&
          hoveredCat !== null &&
          categories[hoveredCat]?.subCategories?.map(
            (item: MenuItem, i: number) => (
              <li key={i}>
                <Link
                  href={item.slug}
                  className="block px-3 py-2 text-[13px] text-muted-foreground hover:text-[var(--brand-primary)] hover:bg-muted/50 rounded-md transition-colors fw-body"
                >
                  {item.name}
                </Link>
              </li>
            ),
          )}
      </ul>
    </div>
  );

  const megaMenuContent = (
    hoveredCat !== null &&
    categories[hoveredCat] && (
      categories[hoveredCat].slug === "pages" ? (
        pagesContent
      ) : (
        <div
          className="grid gap-x-8 gap-y-1"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {categories[hoveredCat]?.subCategories?.map(
            (menu: MenuItem, i: number) => (
              <div key={i}>
                <Link
                  href={
                    "/category/" +
                    categories[hoveredCat].slug +
                    "/" +
                    menu.slug
                  }
                  className="group/head"
                >
                  <h4 className="text-[13px] fw-heading uppercase tracking-wider text-[var(--brand-primary)] mb-3 pb-2 border-b border-border group-hover/head:text-[var(--brand-accent-600)] transition-colors">
                    {menu.name}
                  </h4>
                </Link>
                <ul className="space-y-1.5">
                  {menu.subSubCategories?.map(
                    (subcat) => (
                      <li key={subcat._id}>
                        <Link
                          href={`/category/${categories[hoveredCat].slug}/${menu.slug}/${subcat.slug}`}
                          className="text-[13px] text-muted-foreground hover:text-[var(--brand-primary)] transition-colors inline-flex items-center gap-1 group/link"
                        >
                          <span className="w-0 group-hover/link:w-2 h-[1px] bg-[var(--brand-primary)] transition-all duration-200" />
                          {subcat.name}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
                {menu.subSubCategories?.length > 0 && (
                  <Link
                    href={`/category/${categories[hoveredCat].slug}/${menu.slug}`}
                    className="inline-flex items-center gap-1 text-[12px] text-[var(--brand-primary)] hover:text-[var(--brand-accent-600)] mt-2 fw-body transition-colors"
                  >
                    View All
                    <span className="text-[10px]">→</span>
                  </Link>
                )}
              </div>
            ),
          )}
        </div>
      )
    )
  );

  return (
    <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
      <div
        className="relative flex items-center"
        onMouseEnter={() => {
          if (leaveTimer.current) clearTimeout(leaveTimer.current);
        }}
        onMouseLeave={handleCatLeave}
        ref={navCategoriesRef}
      >
        {categories?.map((cat, idx) => (
          <div
            key={idx}
            ref={(el) => {
              if (el) categoryEls.current.set(idx, el);
            }}
            onMouseEnter={() => {
              if (cat.subCategories?.length) handleCatEnter(idx);
            }}
          >
            {cat.subCategories?.length === 0 ? (
              <Link
                href={urlPrfix(cat.slug)}
                className="relative inline-flex items-center gap-0.5 px-2.5 py-1 text-[12.5px] tracking-normal uppercase fw-body font-medium  text-foreground/90 hover:text-foreground transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ) : (
              <button
                onClick={() => router.push("/category/" + cat.slug)}
                className="relative inline-flex items-center gap-0.5 px-2.5 py-1 text-[12.5px] tracking-normal uppercase fw-body font-medium  text-foreground/90 hover:text-foreground transition-colors whitespace-nowrap"
                aria-haspopup="menu"
              >
                {cat.name}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${hoveredCat === idx ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        ))}

        <span
          className="absolute bottom-0 h-[2px] bg-[var(--brand-primary)] transition-all duration-500  pointer-events-none"
          style={{
            left: `${underlineStyle.left}px`,
            width: `${underlineStyle.width}px`,
            opacity: hoveredCat !== null ? 1 : 0,
          }}
        />

        <div
          className={`
            absolute top-full pt-3 z-[999]
            will-change-[transform,opacity]
            transition-all duration-300
            ${
              hoveredCat !== null
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 -translate-y-4 pointer-events-none"
            }
          `}
          style={{
            left: `${menuLeft}px`,
            transition:
              "opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 500ms cubic-bezier(0.22,1,0.36,1)",
          }}
          onMouseEnter={() => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current);
          }}
          onMouseLeave={handleCatLeave}
        >
          <div
            className="max-w-[90vw] bg-background border border-border shadow-xl rounded-lg overflow-hidden"
            style={{
              width:
                hoveredCat !== null &&
                categories[hoveredCat]?.slug !== "pages"
                  ? `${menuWidth}px`
                  : undefined,
            }}
          >
            {hoveredCat !== null &&
              categories[hoveredCat]?.slug === "pages" ? null : (
              <>
                {hoveredCat !== null && categories[hoveredCat] && (
                  <div className="h-[2px] bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent-400)] to-[var(--brand-primary)]" />
                )}
              </>
            )}
            <div className={hoveredCat !== null && categories[hoveredCat]?.slug === "pages" ? "" : "p-8"}>
              {megaMenuContent}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

const urlPrfix = (slug: string) => {
  if (slug === "home") return "/";
  if (slug === "track-your-order") return "/order-track";
  if (slug === "contact-us") return "/contact-us";
  return "/category/" + slug;
};
