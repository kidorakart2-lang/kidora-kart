"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CategoryItem, MenuItem } from "./header-types";

interface MobileNavProps {
  allCategories: CategoryItem[];
  isOpen: boolean;
  onClose: () => void;
}

const MobileLink = ({ name, href }: { name: string; href: string }) => (
  <SheetClose asChild>
    <Link href={href}>
      <Button
        variant="ghost"
        className="h-auto w-full justify-start rounded-lg px-4 py-3 text-foreground transition-colors duration-200 fw-body hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]"
      >
        {name}
      </Button>
    </Link>
  </SheetClose>
);

export default function MobileNav({
  allCategories,
  isOpen,
  onClose,
}: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="z-[999] w-[82vw] bg-background p-0 sm:w-80"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-base fw-heading text-foreground">
            Menu
          </SheetTitle>
        </SheetHeader>
        <nav className="h-[calc(100vh-72px)] space-y-1 overflow-y-auto p-4">
          {allCategories?.map((cat, idx) => (
            <div key={cat.slug || idx}>
              {cat.subCategories?.length === 0 ? (
                <MobileLink name={cat.name} href={urlPrefix(cat.slug)} />
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  className="w-full border-b border-[var(--brand-gold)]/20"
                >
                  <AccordionItem value={`cat-${idx}`} className="border-b-0">
                    <AccordionTrigger className="px-4 py-3 text-foreground fw-heading hover:no-underline">
                      {cat.name}
                    </AccordionTrigger>
                    <AccordionContent className="bg-[var(--brand-rose)]/15 p-0">
                      <div className="py-1">
                        <MobileLink
                          name={`View all ${cat.name}`}
                          href={urlPrefix(cat.slug)}
                        />
                        {cat.subCategories.map(
                          (menu: MenuItem, menuIdx: number) => {
                            const isPages = cat.slug === "pages";
                            const subHref = `/category/${cat.slug}/${menu.slug}`;

                            if (isPages) {
                              return (
                                <MobileLink
                                  key={menu.slug || menuIdx}
                                  name={menu.name}
                                  href={menu.slug}
                                />
                              );
                            }

                            if (!menu.subSubCategories?.length) {
                              return (
                                <MobileLink
                                  key={menu._id ?? menu.slug ?? menuIdx}
                                  name={menu.name}
                                  href={subHref}
                                />
                              );
                            }

                            return (
                              <Accordion
                                key={menu._id ?? menu.slug ?? menuIdx}
                                type="single"
                                collapsible
                                className="w-full"
                              >
                                <AccordionItem
                                  value={`sub-${menuIdx}`}
                                  className="border-b-0"
                                >
                                  <AccordionTrigger className="px-6 py-2.5 text-sm text-foreground fw-heading hover:no-underline">
                                    {menu.name}
                                  </AccordionTrigger>
                                  <AccordionContent className="p-0">
                                    <div className="pl-4">
                                      <MobileLink
                                        name={`View all ${menu.name}`}
                                        href={subHref}
                                      />
                                      {menu.subSubCategories.map(
                                        (subcat, subIdx) => (
                                          <MobileLink
                                            key={
                                              subcat._id ??
                                              subcat.slug ??
                                              subIdx
                                            }
                                            name={subcat.name}
                                            href={`${subHref}/${subcat.slug}`}
                                          />
                                        ),
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            );
                          },
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

const urlPrefix = (slug: string) => {
  if (slug === "home") return "/";
  if (slug === "track-your-order") return "/order-track";
  if (slug === "contact-us") return "/contact-us";
  return "/category/" + slug;
};
