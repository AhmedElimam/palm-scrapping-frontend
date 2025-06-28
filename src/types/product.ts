export interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  platform: 'amazon' | 'jumia';
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    platform_filter?: string;
  };
}

export interface FetchResponse {
  success: boolean;
  message: string;
  count: number;
  data: Product[];
}

export interface BothApisResponse {
  success: boolean;
  message: string;
  amazon: {
    count: number;
    data: Product[];
  };
  jumia: {
    count: number;
    data: Product[];
  };
  total_count: number;
}

// Legacy type for backward compatibility
export interface FetchProductsResponse extends FetchResponse {}

export interface SingleProductResponse {
  success: boolean;
  data: Product;
}