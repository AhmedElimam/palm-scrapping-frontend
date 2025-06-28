"use client";

import { useProducts } from '@/context/ProductContext';
import { useInfiniteScroll } from '@/hooks/useProduct';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import SearchBar from './SearchBar';

export default function ProductGrid() {
  const { 
    filteredProducts, 
    loading, 
    error, 
    searchQuery, 
    setSearchQuery,
    hasMore,
    loadingMore,
    loadMoreProducts,
    currentLimit,
    currentPage
  } = useProducts();

  const { lastElementRef } = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMoreProducts,
    threshold: 0.1
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Products</h2>
            <p className="text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
              <span className="text-sm text-gray-500 ml-2">
                (Page {currentPage}, Limit: {currentLimit})
              </span>
            </p>
            {/* Debug panel for limit progression */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <div className="flex space-x-4">
                <span>Current Limit: {currentLimit}</span>
                <span>Next Scroll Limit: {currentLimit + 5}</span>
                <span>Next Refresh Limit: {15 + (Math.floor((currentLimit - 15) / 5) + 1) * 5}</span>
                <span>Scroll Count: {currentPage - 1}</span>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-96">
            <SearchBar 
              onSearch={setSearchQuery}
              placeholder="Search by title, price, or ID..."
            />
          </div>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-gray-500 text-lg font-medium mb-2">
            {searchQuery ? 'No products found' : 'No products available'}
          </div>
          <p className="text-gray-400">
            {searchQuery 
              ? `No products match your search for "${searchQuery}"`
              : 'Products will appear here once scraped'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              ref={index === filteredProducts.length - 1 ? lastElementRef : null}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
      
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <LoadingSpinner />
              <span className="text-gray-600">
                Loading more products... (increasing limit from {currentLimit} to {currentLimit + 5})
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Scroll #{currentPage} • Static loading active
            </div>
          </div>
        </div>
      )}
      
      {!hasMore && filteredProducts.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium">All products loaded</p>
          <p className="text-sm">You've reached the end of the product list</p>
          <p className="text-xs text-gray-400 mt-2">
            Final state: Page {currentPage}, Limit: {currentLimit} products per request
          </p>
        </div>
      )}
    </div>
  );
} 