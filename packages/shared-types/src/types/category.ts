/** Category model */
export interface Category {
  _id: string;
  name: string;
  image?: string;
  slug: string;
  order?: number;
  status?: boolean;
  deletedAt?: Date | null;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Sub-category */
export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  categoryId?: string;
  order?: number;
  status?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Sub-sub-category */
export interface SubSubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  subCategoryId?: string;
  order?: number;
  status?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
