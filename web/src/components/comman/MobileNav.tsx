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

interface MobileLinkProps {
  name: string;
  href: string;
}

const MobileLink = ({ name, href }: MobileLinkProps) => (
  <SheetClose asChild>
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start py-3 px-4 text-foreground hover:bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] transition-colors duration-200 rounded-lg fw-body h-auto"
      >
        {name}
      </Button>
    </Link>
  </SheetClose>
);

export default function MobileNav({ allCategories, isOpen, onClose }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-[82vw] sm:w-80 bg-background p-0 z-[999]"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-base fw-heading text-foreground">
            Menu
          </SheetTitle>
        </SheetHeader>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-72px)]">
          {allCategories?.map((cat, idx) => (
            <div key={idx}>
              {cat.subCategories?.length === 0 ? (
                <MobileLink name={cat.name} href={urlPrfix(cat.slug)} />
              ) : (
                <Accordion type="single" collapsible className="w-full border-b">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="py-3 px-4 text-foreground hover:no-underline fw-heading">
                      <Link href={cat.slug === "home" ? "/" : cat.slug}>
                        {cat.name}
                      </Link>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 bg-muted/40">
                      {cat.subCategories?.map(
                        (menu: MenuItem, menuIdx: number) => {
                          const isPages = cat.slug === "pages";
                          return (
                            <div key={menuIdx}>
                              {isPages ? (
                                <MobileLink
                                  name={menu.name}
                                  href={menu.slug}
                                />
                              ) : menu.subSubCategories?.length ? (
                                <Accordion
                                  type="single"
                                  collapsible
                                  className="w-full"
                                >
                                  <AccordionItem
                                    value="item-1"
                                    className="border-b-0"
                                  >
                                    <AccordionTrigger className="py-2.5 px-6 text-foreground hover:no-underline fw-heading text-sm">
                                      <SheetClose asChild>
                                        <Link
                                          href={
                                            "/category/" +
                                            cat.slug +
                                            "/" +
                                            menu.slug
                                          }
                                        >
                                          {menu.name}
                                        </Link>
                                      </SheetClose>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">
                                      {menu.subSubCategories?.map(
                                        (
                                          subcat,
                                          subIdx: number,
                                        ) => (
                                          <div key={subIdx} className="pl-4">
                                            <MobileLink
                                              name={subcat.name}
                                              href={
                                                "/category/" +
                                                cat.slug +
                                                "/" +
                                                menu.slug +
                                                "/" +
                                                subcat.slug
                                              }
                                            />
                                          </div>
                                        ),
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : (
                                <MobileLink
                                  name={menu.name}
                                  href={
                                    "/category/" +
                                    cat.slug +
                                    "/" +
                                    menu.slug
                                  }
                                />
                              )}
                            </div>
                          );
                        },
                      )}
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

const urlPrfix = (slug: string) => {
  if (slug === "home") return "/";
  if (slug === "track-your-order") return "/order-track";
  if (slug === "contact-us") return "/contact-us";
  return "/category/" + slug;
};
