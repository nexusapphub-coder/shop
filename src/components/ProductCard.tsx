import { Star, ShoppingBag, Sparkles, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { formatPrice, cn } from '../utils';
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
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 relative">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </Link>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        
        <div className="absolute top-1.5 right-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => onShowStyleGuide(product)}
            className="p-2 lg:p-1.5 bg-white/90 backdrop-blur-md text-black rounded-lg hover:bg-white transition-colors active:scale-95 shadow-lg"
            title="AI Style Guide"
          >
            <Sparkles className="w-3.5 h-3.5 lg:w-3 lg:h-3 text-amber-500" />
          </button>
        </div>
      </div>
      <div className="mt-1.5 space-y-0.5">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xs font-bold text-gray-900 hover:underline line-clamp-1 leading-tight">{product.name}</h3>
        </Link>
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <p className="text-sm font-black text-black">{formatPrice(product.price)}</p>
            {product.isStockOut && (
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Stock Out</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAddToCart(product)}
              disabled={product.isStockOut}
              className={cn(
                "p-2 lg:p-1.5 rounded-md transition-all active:scale-90",
                product.isStockOut 
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed" 
                  : "bg-gray-100 text-black hover:bg-black hover:text-white"
              )}
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
            </button>
            <button
              onClick={() => onBuyNow(product)}
              disabled={product.isStockOut}
              className={cn(
                "px-3 py-1.5 lg:px-2.5 lg:py-1.5 text-[11px] lg:text-xs font-bold rounded-md transition-all active:scale-90",
                product.isStockOut
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              )}
            >
              Buy
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-bold">{product.category}</p>
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-bold text-gray-700">{product.rating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
