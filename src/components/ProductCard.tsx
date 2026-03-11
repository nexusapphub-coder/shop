import { Star, ShoppingBag, Sparkles, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onShowStyleGuide: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onAddToCart, onBuyNow, onShowStyleGuide }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 relative">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </Link>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
        
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={() => onBuyNow(product)}
            className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 shadow-xl"
          >
            Buy Now
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onAddToCart(product)}
              className="flex-1 bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-95 shadow-xl text-xs"
            >
              <ShoppingBag className="w-3 h-3" />
              Add to Cart
            </button>
            <button
              onClick={() => onShowStyleGuide(product)}
              className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/30 transition-colors active:scale-95 shadow-xl text-[10px]"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              AI Guide
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between items-start">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-sm font-medium text-gray-900 hover:underline">{product.name}</h3>
          </Link>
          <p className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</p>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category}</p>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium text-gray-700">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>
      </div>
    </motion.div>
  );
}
