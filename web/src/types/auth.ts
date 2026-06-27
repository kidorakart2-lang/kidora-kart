export interface UserAddress {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  instructions?: string;
}

export interface UserDetails {
  _id?: string;
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  gender?: string;
  isEmailVerified?: boolean;
  address?: UserAddress;
}
