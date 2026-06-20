import React, { useState, useEffect } from 'react';
import type { Product } from '@eshopnepal/shared';
import { productsApi } from '@eshopnepal/shared';
import { useCart } from '@eshopnepal/shared';
import { ArrowLeft, ShoppingBag, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface ProductDetailViewProps {
  productId: number;
  navigate: (path: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  productId, navigate, onSuccess, onError
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productsApi.getById(productId);
        setProduct(data);
      } catch (err) {
        console.error(err);
        onError('Could not load product.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    const err = await addToCart(product.id, quantity);
    setAdding(false);
    if (err) onError(err);
    else onSuccess(`Added ${quantity}x ${product.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Product not found.</p>
        <button onClick={() => navigate('/products')} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 cursor-pointer">
          Back to Shop
        </button>
      </div>
    );
  }

  const isSale = product.sale_price !== null && Number(product.sale_price) < Number(product.price);
  const currentPrice = isSale ? Number(product.sale_price) : Number(product.price);
  const oldPrice = Number(product.price);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/products')}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to products
      </button>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center justify-center">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
            alt={product.name}
            className="max-h-[400px] object-contain transition-transform duration-500 hover:scale-105"
          />
        </div>

        <div className="flex flex-col justify-between">
          <div>
            {product.category_name && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Sparkles size={12} /> {product.category_name}
              </span>
            )}
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-4">
              <span className="text-3xl font-extrabold text-gray-950">${currentPrice.toFixed(2)}</span>
              {isSale && <span className="text-xl text-gray-400 line-through">${oldPrice.toFixed(2)}</span>}
            </div>
            <div className="mt-6 flex items-center gap-2">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle size={16} /> In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500">
                  <AlertTriangle size={16} /> Out of Stock
                </span>
              )}
            </div>
            <p className="mt-6 text-base leading-relaxed text-gray-600">
              {product.description || 'No description available.'}
            </p>
          </div>

          {product.stock > 0 && (
            <div className="mt-10 border-t border-gray-100 pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50/50 p-1">
                  <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-gray-500 hover:bg-white hover:text-gray-900 cursor-pointer">-</button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-gray-500 hover:bg-white hover:text-gray-900 cursor-pointer">+</button>
                </div>
                <button onClick={handleAddToCart} disabled={adding}
                  className="flex flex-grow items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300 cursor-pointer">
                  <ShoppingBag size={20} />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
