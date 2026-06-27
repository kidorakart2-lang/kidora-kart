/** Cart item product reference */
export interface CartProductRef {
  product: string;
  quantity: number;
  color: string;
  size?: string | null;
}

/** Cart model */
export interface Cart {
  _id: string;
  user: string;
  items: CartProductRef[];
  createdAt?: Date;
  updatedAt?: Date;
}
