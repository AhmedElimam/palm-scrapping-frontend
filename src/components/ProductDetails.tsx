"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Button from './ui/Button';
import { getCurrencyInfo, formatPriceWithCurrency, formatDate } from '@/lib/currencyUtils';
import { useProduct } from '@/hooks/useProduct';

interface ProductDetailsProps {
  productId: number;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const { product, loading, error } = useProduct(productId);
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Product not found</div>
        <Button
          onClick={() => router.push('/')}
          className="mt-4"
        >
          Back to Products
        </Button>
      </div>
    );
  }

  const priceString = product.price.toString();
  const currencyInfo = getCurrencyInfo(priceString);
  const formattedPrice = formatPriceWithCurrency(priceString);
  const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE3OS4wOSAxNTAgMTYyIDE2Ny4wOSAxNjIgMTg4QzE2MiAyMDguOTEgMTc5LjA5IDIyNiAyMDAgMjI2QzIyMC45MSAyMjYgMjM4IDIwOC45MSAyMzggMTg4QzIzOCAxNjcuMDkgMjIwLjkxIDE1MCAyMDAgMTUwWk0yMDAgMjQ2QzE3OS4wOSAyNDYgMTYyIDI2My4wOSAxNjIgMjg0QzE2MiAzMDQuOTEgMTc5LjA5IDMyMiAyMDAgMzIyQzIyMC45MSAzMjIgMjM4IDMwNC45MSAyMzggMjg0QzIzOCAyNjMuMDkgMjIwLjkxIDI0NiAyMDAgMjQ2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="relative">
            <div className="aspect-square overflow-hidden">
              <img
                src={imageError ? placeholderImage : product.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
            <div className="absolute top-6 left-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {currencyInfo.currency}
              </span>
            </div>
            <div className="absolute top-6 right-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                ID: {product.id}
              </span>
            </div>
          </div>

          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {product.title}
                </h1>
              </div>

              <div className="border-t border-b border-gray-200 py-6">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-gray-900">
                    {formattedPrice}
                  </div>
                  <div className="text-right text-sm text-gray-500 space-y-1">
                    <div>Created: {formatDate(product.created_at)}</div>
                    <div>Updated: {formatDate(product.updated_at)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Information</h3>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Currency:</span>
                      <span className="font-semibold text-gray-900">{currencyInfo.currency}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Price:</span>
                      <span className="font-semibold text-gray-900 text-lg">{formattedPrice}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Platform:</span>
                      <span className="font-semibold text-gray-900 capitalize">{product.platform}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Created:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(product.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Last Updated:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(product.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 