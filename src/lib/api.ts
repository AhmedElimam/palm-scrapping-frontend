import { ProductResponse, Product, FetchResponse, SingleProductResponse, BothApisResponse } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Get all products (unified - both Amazon and Jumia)
  async getProducts(page: number = 1, limit: number = 15, platform?: string): Promise<ProductResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: limit.toString(),
    });
    
    if (platform) {
      params.append('platform', platform);
    }
    
    return this.request<ProductResponse>(`/api/products?${params.toString()}`);
  }

  // Get products by specific platform
  async getProductsByPlatform(platform: 'amazon' | 'jumia', page: number = 1, limit: number = 15): Promise<ProductResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: limit.toString(),
    });
    
    return this.request<ProductResponse>(`/api/products/platform/${platform}?${params.toString()}`);
  }

  // Get single product by ID
  async getProduct(id: number): Promise<Product> {
    const response = await this.request<SingleProductResponse>(`/api/products/${id}`);
    return response.data;
  }

  // Fetch new products from Amazon API (GET request)
  async fetchAmazonProducts(limit: number = 10): Promise<FetchResponse> {
    return this.request<FetchResponse>(`/api/products/fetch-apify?limit=${limit}`);
  }

  // Fetch new products from Jumia API (GET request)
  async fetchJumiaProducts(limit: number = 10): Promise<FetchResponse> {
    return this.request<FetchResponse>(`/api/products/fetch-jumia-apify?limit=${limit}`);
  }

  // Fetch new products from both APIs (GET request)
  async fetchBothApis(amazonLimit: number = 5, jumiaLimit: number = 5): Promise<BothApisResponse> {
    return this.request<BothApisResponse>(`/api/products/fetch-both-apis?amazon_limit=${amazonLimit}&jumia_limit=${jumiaLimit}`);
  }

  // POST versions for fetching (if needed)
  async fetchAmazonProductsPost(limit: number = 10): Promise<FetchResponse> {
    return this.request<FetchResponse>('/api/products/fetch-apify', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  }

  async fetchJumiaProductsPost(limit: number = 10): Promise<FetchResponse> {
    return this.request<FetchResponse>('/api/products/fetch-jumia-apify', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  }

  async fetchBothApisPost(amazonLimit: number = 5, jumiaLimit: number = 5): Promise<BothApisResponse> {
    return this.request<BothApisResponse>('/api/products/fetch-both-apis', {
      method: 'POST',
      body: JSON.stringify({ amazon_limit: amazonLimit, jumia_limit: jumiaLimit }),
    });
  }

  // Fetch products from both platforms with pagination
  async fetchProductsWithPagination(page: number = 1, limit: number = 15): Promise<ProductResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: limit.toString(),
    });
    
    return this.request<ProductResponse>(`/api/products/paginated?${params.toString()}`);
  }

  // Legacy method for backward compatibility
  async refreshProducts(): Promise<FetchResponse> {
    return this.fetchAmazonProducts(10);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);