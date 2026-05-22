import React from 'react';
import { Product } from '../types';
import { Star, Tag, Smartphone, Package } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick(product)}
    >
      <div className="aspect-square relative overflow-hidden bg-zinc-100">
        <img
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.type === 'refurbished' && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
            Refurbished
          </div>
        )}
        {product.type === 'pouch' && (
          <div className="absolute top-3 left-3 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
            Pouch
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-zinc-900 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl transform -rotate-12">
              Sold Out
            </div>
          </div>
        )}
        {product.promotion && product.stock > 0 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
            {product.promotion}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-zinc-900 line-clamp-1">{product.name}</h3>
        </div>
        
        <p className="text-xs text-zinc-500 mb-3 line-clamp-2 h-8">{product.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-zinc-900">R{product.price.toLocaleString()}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-red-400 line-through font-bold">
                Was R{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            {product.type === 'refurbished' ? (
              <Smartphone className="h-4 w-4 text-zinc-400" />
            ) : product.type === 'pouch' ? (
              <Package className="h-4 w-4 text-zinc-400" />
            ) : (
              <Tag className="h-4 w-4 text-zinc-400" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
