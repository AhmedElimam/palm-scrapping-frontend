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
  // Pagination state
  currentPage: number;
  currentLimit: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreProducts: () => Promise<void>;
  resetPagination: () => void;
  // Fetch both platforms
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
  
  // Pagination state
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
      
      setHasMore(response.data.length === limit); // If we get less than the limit, we've reached the end
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

  // Scroll increases the limit by 5 each time (same as refresh)
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = currentPage + 1;
    const nextLimit = currentLimit + 5; // Increase by 5 each scroll (same as refresh)
    const nextScrollCount = scrollCount + 1;
    
    console.log(`[SCROLL] Scroll #${nextScrollCount}: Fetching page ${nextPage} with limit ${nextLimit} (increased from ${currentLimit})`);
    
    setScrollCount(nextScrollCount);
    await fetchProducts(nextPage, nextLimit, true);
    setCurrentLimit(nextLimit); // Make sure currentLimit is updated for the next scroll
  }, [currentPage, currentLimit, hasMore, loadingMore, fetchProducts, scrollCount]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setCurrentLimit(DEFAULT_LIMIT);
    setHasMore(true);
    setProducts([]);
    setScrollCount(0);
    setRefreshCount(0);
  }, []);

  // Refresh increases the limit each time
  const refreshProducts = useCallback(async () => {
    try {
      setError(null);
      setFetchingBoth(true);
      
      // Increase limit for each refresh
      const nextRefreshCount = refreshCount + 1;
      const refreshLimit = DEFAULT_LIMIT + (nextRefreshCount * 5); // Start at 15, increase by 5 each time
      
      console.log(`[REFRESH] Starting refresh #${nextRefreshCount} with limit: ${refreshLimit}`);
      
      const response = await apiClient.fetchBothApis(refreshLimit, refreshLimit);
      console.log('[REFRESH] Raw response received:', JSON.stringify(response, null, 2));
      
      // Handle different possible response structures
      let combinedProducts: Product[] = [];
      
      if (response && (response as any).success) {
        // Try the expected BothApisResponse structure
        if ((response as any).amazon && (response as any).jumia) {
          const amazonProducts = (response as any).amazon.data || [];
          const jumiaProducts = (response as any).jumia.data || [];
          combinedProducts = [...amazonProducts, ...jumiaProducts];
          console.log('[REFRESH] Using BothApisResponse structure');
        }
        // Try if it's a simple array of products
        else if (Array.isArray((response as any).data)) {
          combinedProducts = (response as any).data;
          console.log('[REFRESH] Using simple data array structure');
        }
        // Try if it's a different structure
        else {
          console.log('[REFRESH] Unknown response structure, trying to extract products...');
          // Try to find products in the response
          const responseAny = response as any;
          const allKeys = Object.keys(responseAny);
          console.log('[REFRESH] Response keys:', allKeys);
          
          // Look for any array that might contain products
          for (const key of allKeys) {
            if (Array.isArray(responseAny[key])) {
              console.log(`[REFRESH] Found array in key '${key}':`, responseAny[key].length, 'items');
              if (responseAny[key].length > 0 && responseAny[key][0].id) {
                combinedProducts = responseAny[key];
                console.log(`[REFRESH] Using products from key '${key}'`);
                break;
              }
            }
          }
        }
        
        console.log('[REFRESH] Final combined products:', combinedProducts.length);
        console.log('[REFRESH] Setting products to state...');
        
        setProducts(combinedProducts);
        setLastUpdated(new Date());
        setCurrentPage(1);
        setCurrentLimit(refreshLimit);
        setRefreshCount(nextRefreshCount);
        setHasMore(true);
        console.log(`[REFRESH] Products set from fetchBothApis, limit: ${refreshLimit}`);
      } else {
        console.error('[REFRESH] Invalid response structure:', response);
        throw new Error(`Invalid response structure: ${JSON.stringify(response)}`);
      }
    } catch (err) {
      console.error('[REFRESH] Error in fetchBothApis, trying fallback:', err);
      // Fallback to getProducts if fetchBothApis fails
      try {
        const nextRefreshCount = refreshCount + 1;
        const refreshLimit = DEFAULT_LIMIT + (nextRefreshCount * 5);
        
        console.log(`[REFRESH] Trying fallback with getProducts, limit: ${refreshLimit}`);
        const fallback = await apiClient.getProducts(1, refreshLimit);
        console.log('[REFRESH] Fallback response:', fallback);
        
        setProducts(fallback.data);
        setLastUpdated(new Date());
        setCurrentPage(1);
        setCurrentLimit(refreshLimit);
        setRefreshCount(nextRefreshCount);
        setHasMore(true);
        console.log(`[REFRESH-FALLBACK] Products set from getProducts, limit: ${refreshLimit}`);
      } catch (fallbackErr) {
        console.error('[REFRESH] Fallback also failed:', fallbackErr);
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Failed to refresh products');
      }
    } finally {
      setFetchingBoth(false);
      console.log('[REFRESH] Refresh completed');
    }
  }, [refreshCount]);

  const fetchBothPlatforms = useCallback(async (amazonLimit?: number, jumiaLimit?: number) => {
    try {
      setError(null);
      setFetchingBoth(true);
      
      // Use the new fetchBothApis method that fetches from both platforms
      const response = await apiClient.fetchBothApis(amazonLimit || 5, jumiaLimit || 5);
      
      console.log('Fetch both APIs response:', response);
      
      // Check if response has the expected structure
      if (response && response.success) {
        // Combine products from both platforms
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

  // Initial load and interval refresh always use the default limit
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

  // Reset pagination when search query changes
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