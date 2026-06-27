/** Shipping / billing address */
export interface Address {
  pincode: number | null;
  state: string;
  city: string;
  street: string;
  area: string;
  instructions?: string;
}

/** Full address used in orders */
export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  area: string;
  street: string;
  addressLine1?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  landmark?: string;
  instructions?: string;
}
