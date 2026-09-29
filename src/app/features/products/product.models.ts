import { PaginationMeta } from '../../core/models/api.models';

export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  brand: string;
  price: number;
  photo: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: ProductRecord[];
  meta: PaginationMeta;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: ProductRecord;
}

export interface ProductFormValue {
  name: string;
  brand: string;
  price: number;
}

export interface EmptyProductResponse {
  success: boolean;
  message: string;
  data: null;
}

export type ProductExportFormat = 'pdf' | 'excel';
