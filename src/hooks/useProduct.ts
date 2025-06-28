'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { ProductResponse, Product, FetchProductsResponse } from '@/types/product';

interface UseProductsOptions {
  page?: number;
  limit?: number;
  platform?: string;
  autoFetch?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  meta: ProductResponse['meta'] | null;
  fetchProducts: (page?: number, platform?: string) => Promise<void>;
  fetchNewProducts: (platform?: 'amazon' | 'jumia' | 'both') => Promise<void>;
  refreshProducts: () => Promise<void>;
  hasMore: boolean;
  currentPage: number;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { page = 1, limit = 15, platform, autoFetch = true } = options;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ProductResponse['meta'] | null>(null);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchProducts = useCallback(async (pageNum = currentPage, platformFilter = platform) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getProducts(pageNum, limit, platformFilter);
      setProducts(response.data);
      setMeta(response.meta);
      setCurrentPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, platform]);

  const fetchNewProducts = useCallback(async (platformFilter?: 'amazon' | 'jumia' | 'both') => {
    setLoading(true);
    setError(null);
    try {
      switch (platformFilter) {
        case 'amazon':
          await apiClient.fetchAmazonProducts(10);
          break;
        case 'jumia':
          await apiClient.fetchJumiaProducts(10);
          break;
        case 'both':
          await apiClient.fetchBothApis(5, 5);
          break;
        default:
          await apiClient.fetchAmazonProducts(10);
      }
      await fetchProducts(1, platform);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch new products');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProducts, platform]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts(1, platform);
  }, [fetchProducts, platform]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  const hasMore = meta ? currentPage < meta.last_page : false;

  return {
    products,
    loading,
    error,
    meta,
    fetchProducts,
    fetchNewProducts,
    refreshProducts,
    hasMore,
    currentPage,
  };
}

export function useProduct(productId: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    apiClient.getProduct(productId)
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch product'))
      .finally(() => setLoading(false));
  }, [productId]);

  return { product, loading, error };
}

interface UseInfiniteScrollProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  threshold?: number;
}

export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 0.1
}: UseInfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading || !hasMore) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px'
      }
    );
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [loading, hasMore, onLoadMore, threshold]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef };
}