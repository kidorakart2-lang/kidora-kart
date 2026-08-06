"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CategoryItem, MenuItem } from "./header-types";

interface DesktopNavProps {
  categories: CategoryItem[];
}

export default function DesktopNav({ categories }: DesktopNavProps) {
  const router = useRouter();

  return (
    <nav className="relative hidden md:flex flex-wrap justify-center items-center gap-x-8 text-sm font-medium py-3.5 bg-background border-b border-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]">
      {categories?.map((cat, idx) => (
        <div key={idx} className="group">
          {cat.subCategories?.length === 0 ? (
            <Link
              href={urlPrfix(cat.slug)}
              className="relative hover:text-[var(--brand-primary)] transition-all duration-300 text-[15px] whitespace-nowrap pb-1.5 text-foreground font-medium"
            >
              {cat.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-brand transition-all duration-300 group-hover:w-full" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => router.push("/category/" + cat.slug)}
                className="relative hover:text-[var(--brand-primary)] transition-all duration-300 text-[15px] whitespace-nowrap pb-1.5 text-foreground flex items-center gap-1.5 font-medium"
                aria-haspopup="menu"
              >
                {cat.name}
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-brand transition-all duration-300 group-hover:w-full" />
              </button>

              {/* Premium Mega Menu — absolute to the nav row so it always sits
                  flush against the navbar bottom (no gap, scroll-safe). The
                  -mt-4/pt-4 wrapper doubles as a transparent hover bridge so
                  the menu never collapses while moving the cursor down to it. */}
              <div
                className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 [transform:_perspective(600px)_rotateX(-90deg)] duration-500 skew-x-10 group-hover:skew-x-0 origin-top group-hover:[transform:_perspective(1200px)_rotateX(0deg)] transition-all absolute left-1/2 -translate-x-1/2 top-full -mt-4 pt-4 z-[999] hover:visible hover:opacity-100`}
              >
                <Card className="w-[1150px] backdrop-blur-xl max-w-[98vw] h-auto bg-background/98 shadow-2xl rounded-2xl p-6 border border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]">
                  <div className="grid grid-cols-5 gap-6">
                    {cat.subCategories?.map((menu: MenuItem, i: number) => (
                      <div key={i} className="group/menu">
                        <Link href={"/category/" + cat.slug + "/" + menu.slug}>
                          <h4 className="font-bold text-foreground mb-2 pb-1 border-b border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)] text-base hover:text-[var(--brand-primary)] transition-colors">
                            <Badge
                              variant="outline"
                              className="text-sm font-bold text-[var(--brand-primary)] border-[var(--brand-primary)] bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] to-[color-mix(in_srgb,var(--brand-secondary)_8%,transparent)] hover:from-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] hover:to-[color-mix(in_srgb,var(--brand-secondary)_15%,transparent)] transition-all duration-300 px-3 py-1"
                            >
                              {menu.name}
                            </Badge>
                          </h4>
                        </Link>
                        <div className="space-y-2.5">
                          {menu.subSubCategories?.map((subcat, j: number) => (
                            <div key={j}>
                              <ul className="space-y-1 text-foreground text-sm">
                                <li key={subcat._id}>
                                  <Link
                                    href={`/category/${cat.slug}/${menu.slug}/${subcat.slug}`}
                                    className="block hover:text-[var(--brand-secondary)] cursor-pointer transition-all duration-200 hover:translate-x-1 hover:font-medium py-[2px]"
                                  >
                                    {subcat.name}
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          ))}
                          {menu.subSubCategories?.length > 0 && (
                            <Link
                              href={`/category/${cat.slug}/${menu.slug}`}
                              className="inline-flex items-center gap-1 text-[12px] text-[var(--brand-primary)] hover:text-[var(--brand-accent-600)] mt-1 fw-body transition-colors"
                            >
                              View All <span className="text-[10px]">→</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

const urlPrfix = (slug: string) => {
  if (slug === "home") return "/";
  if (slug === "track-your-order") return "/order-track";
  if (slug === "contact-us") return "/contact-us";
  return "/category/" + slug;
};
