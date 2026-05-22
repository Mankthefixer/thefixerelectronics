export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt: string;
  address?: string;
  phoneNumber?: string;
}

export type ProductType = 'gadget' | 'refurbished' | 'pouch';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description: string;
  price: number;
  originalPrice?: number;
  promotion?: string;
  category: string;
  stock: number;
  rating: number;
  ratingCount: number;
  specs: Record<string, string>;
  model?: string;
  refurbishedDate?: string;
  condition?: string;
  imageUrl: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type OrderStatus = 'placed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  price: number;
  status: OrderStatus;
  paymentMethod: 'cod';
  address: string;
  phoneNumber: string;
  brand?: string;
  model?: string;
  createdAt: any;
  paymentStatus?: 'pending' | 'awaiting_payment' | 'paid';
}
