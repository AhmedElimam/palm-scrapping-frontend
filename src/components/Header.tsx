"use client";

import { useProducts } from '@/context/ProductContext';
import Button from './ui/Button';

export default function Header() {
  const { lastUpdated, refreshProducts, fetchingBoth } = useProducts();

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Product Scraper</h1>
                <p className="text-blue-100 text-sm">
                  Real-time product data from web scraping
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="hidden md:block text-blue-100 text-sm bg-white/10 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                </div>
              </div>
            )}
            <Button
              onClick={refreshProducts}
              disabled={fetchingBoth}
              variant="secondary"
              size="md"
              className={`bg-white/20 hover:bg-white/30 border-white/30 transition-all duration-300 ${
                fetchingBoth ? 'animate-pulse opacity-75' : ''
              }`}
            >
              <svg 
                className={`w-4 h-4 mr-2 transition-transform duration-300 ${
                  fetchingBoth ? 'animate-spin' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {fetchingBoth ? 'Refreshing...' : 'Refresh Now'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 