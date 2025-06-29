import ProductGrid from '@/components/ProductGrid';
import Header from '@/components/Header';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-24">
        <ProductGrid />
      </main>
    </div>
  );
}
