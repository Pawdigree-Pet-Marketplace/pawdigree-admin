
import { apiRequest, unwrapList } from "./api";

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  display_order: number;
}

export interface MerchandiseProduct {
  id: number;
  business: string;
  category: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export async function getMerchandise(): Promise<MerchandiseProduct[]> {
  const response = await apiRequest<unknown>("/products/");
  return unwrapList<MerchandiseProduct>(response);
}

export async function getMerchandiseProduct(
  id: number,
): Promise<MerchandiseProduct> {
  return apiRequest<MerchandiseProduct>(`/products/${id}/`);
}
