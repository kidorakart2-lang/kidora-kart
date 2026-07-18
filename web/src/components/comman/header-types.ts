"use client";

export interface SubSubCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface MenuItem {
  name: string;
  slug: string;
  _id?: string;
  subSubCategories: SubSubCategory[];
}

export interface CategoryItem {
  name: string;
  slug: string;
  _id?: string;
  subCategories: MenuItem[];
}
