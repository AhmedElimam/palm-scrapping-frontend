"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, ProductResponse } from '@/types/product';
import { apiClient } from '@/lib/api';

interface ProductContextType {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshProducts: () => Promise<void>;
  currentPage: number;
  currentLimit: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreProducts: () => Promise<void>;
  resetPagination: () => void;
  fetchBothPlatforms: (amazonLimit?: number, jumiaLimit?: number) => Promise<void>;
  fetchingBoth: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchingBoth, setFetchingBoth] = useState(false);
  const [scrollCount, setScrollCount] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const DEFAULT_LIMIT = 15;

  const fetchProducts = useCallback(async (page: number = 1, limit: number = DEFAULT_LIMIT, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const response: ProductResponse = await apiClient.getProducts(page, limit);
      
      if (append) {
        setProducts(prev => [...prev, ...response.data]);
      } else {
        setProducts(response.data);
      }
      
      setHasMore(response.data.length === limit); 
      setCurrentPage(page);
      setCurrentLimit(limit);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = currentPage + 1;
    const nextLimit = currentLimit + 5; 
    const nextScrollCount = scrollCount + 1;
    
    console.log(`[SCROLL] Scroll #${nextScrollCount}: Fetching page ${nextPage} with limit ${nextLimit} (increased from ${currentLimit})`);
    
    setScrollCount(nextScrollCount);
    await fetchProducts(nextPage, nextLimit, true);
    setCurrentLimit(nextLimit); 
  }, [currentPage, currentLimit, hasMore, loadingMore, fetchProducts, scrollCount]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setCurrentLimit(DEFAULT_LIMIT);
    setHasMore(true);
    setProducts([]);
    setScrollCount(0);
    setRefreshCount(0);
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      setError(null);
      setFetchingBoth(true);
      
      const nextRefreshCount = refreshCount + 1;
      const refreshLimit = DEFAULT_LIMIT + (nextRefreshCount * 5); 
      
      console.log(`[REFRESH] Starting refresh #${nextRefreshCount} with limit: ${refreshLimit}`);
      
      console.log('[REFRESH] Calling fetchBothApis as backend indicator...');
      await apiClient.fetchBothApis(refreshLimit, refreshLimit);
      console.log('[REFRESH] Backend indicator call completed');
      
      console.log('[REFRESH] Fetching display data with getProducts...');
      const response = await apiClient.getProducts(1, refreshLimit);
      console.log('[REFRESH] getProducts response:', response);
      
      setProducts(response.data);
      setLastUpdated(new Date());
      setCurrentPage(1);
      setCurrentLimit(refreshLimit);
      setRefreshCount(nextRefreshCount);
      setHasMore(true);
      console.log(`[REFRESH] Products set from getProducts, limit: ${refreshLimit}`);
      
    } catch (err) {
      console.error('[REFRESH] Error in refreshProducts:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh products');
    } finally {
      setFetchingBoth(false);
      console.log('[REFRESH] Refresh completed');
    }
  }, [refreshCount]);

  const fetchBothPlatforms = useCallback(async (amazonLimit?: number, jumiaLimit?: number) => {
    try {
      setError(null);
      setFetchingBoth(true);
      
      const response = await apiClient.fetchBothApis(amazonLimit || 5, jumiaLimit || 5);
      
      console.log('Fetch both APIs response:', response);
      
      if (response && response.success) {
        const amazonProducts = response.amazon?.data || [];
        const jumiaProducts = response.jumia?.data || [];
        const combinedProducts = [...amazonProducts, ...jumiaProducts];
        
        console.log(`Combined ${amazonProducts.length} Amazon + ${jumiaProducts.length} Jumia = ${combinedProducts.length} total products`);
        
        setProducts(combinedProducts);
        setLastUpdated(new Date());
        setCurrentPage(1);
        setCurrentLimit(15);
        setHasMore(true);
      } else {
        throw new Error(`Invalid response structure: ${JSON.stringify(response)}`);
      }
    } catch (err) {
      console.error('Fetch both platforms error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products from both platforms');
    } finally {
      setFetchingBoth(false);
    }
  }, []);

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.title.toLowerCase().includes(query) ||
      product.price.toString().toLowerCase().includes(query) ||
      product.id.toString().includes(query)
    );
  });

  useEffect(() => {
    if (!isInitialized) {
      const initializeProducts = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await apiClient.fetchBothApis(DEFAULT_LIMIT, DEFAULT_LIMIT);
          if (response && response.success) {
            const amazonProducts = response.amazon?.data || [];
            const jumiaProducts = response.jumia?.data || [];
            const combinedProducts = [...amazonProducts, ...jumiaProducts];
            setProducts(combinedProducts);
            setLastUpdated(new Date());
            setCurrentPage(1);
            setCurrentLimit(DEFAULT_LIMIT);
            setHasMore(true);
          } else {
            throw new Error('Invalid response structure from fetch both APIs');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to initialize products');
        } finally {
          setLoading(false);
        }
      };
      initializeProducts();
      setIsInitialized(true);
    }
    const interval = setInterval(() => {
      refreshProducts();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshProducts, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      resetPagination();
      fetchProducts(1, 15, false);
    }
  }, [searchQuery, isInitialized, resetPagination, fetchProducts]);

  return (
    <ProductContext.Provider value={{
      products,
      filteredProducts,
      loading,
      error,
      lastUpdated,
      searchQuery,
      setSearchQuery,
      refreshProducts,
      currentPage,
      currentLimit,
      hasMore,
      loadingMore,
      loadMoreProducts,
      resetPagination,
      fetchBothPlatforms,
      fetchingBoth,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
} 