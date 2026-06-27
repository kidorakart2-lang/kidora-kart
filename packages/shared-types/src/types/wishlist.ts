/** Wishlist model */
export interface Wishlist {
  _id: string;
  user: string;
  items: Array<{
    product: string;
    addedAt?: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}
