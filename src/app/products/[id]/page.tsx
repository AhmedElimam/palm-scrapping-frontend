import ProductDetails from '@/components/ProductDetails';
import { notFound } from 'next/navigation';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const productId = parseInt(params.id);
  
  if (isNaN(productId)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <ProductDetails productId={productId} />
      </main>
    </div>
  );
} 