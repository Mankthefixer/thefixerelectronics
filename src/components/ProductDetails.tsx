import React, { useState, useEffect } from 'react';
import { Product, Rating } from '../types';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment, where } from 'firebase/firestore';
import { ChevronLeft, MessageCircle, Star, Send, ShieldCheck, Calendar, Smartphone, ShoppingBag, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import RatingStars from './RatingStars';
import CheckoutModal from './CheckoutModal';
import { motion } from 'motion/react';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onBack }) => {
  const { profile, signIn } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutPrice, setCheckoutPrice] = useState(0);
  const [warranty, setWarranty] = useState('12-Month Thefixer Warranty');

  const formatDate = (date: any) => {
    if (!date) return 'Just now';
    try {
      if (typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'Recent';
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'ratings'), where('productId', '==', product.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedRatings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
      setRatings(fetchedRatings.sort((a, b) => {
        const timeA = a.createdAt ? (a.createdAt as any).seconds || new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? (b.createdAt as any).seconds || new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ratings');
    });
    return () => unsubscribe();
  }, [product.id]);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'developerInfo'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.warranty) setWarranty(data.warranty);
      }
    });
    return () => unsubSettings();
  }, []);

  const handleBuyNow = (price: number) => {
    if (!profile) {
      signIn();
      return;
    }
    setCheckoutPrice(price);
    setShowCheckout(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-8 group"
      >
        <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Shop</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-square rounded-3xl overflow-hidden bg-zinc-100 border border-black/5 shadow-inner"
        >
          <img
            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/800/800`}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                product.type === 'refurbished' ? 'bg-emerald-100 text-emerald-700' : 
                product.type === 'pouch' ? 'bg-blue-100 text-blue-700' :
                'bg-zinc-100 text-zinc-700'
              }`}>
                {product.type}
              </span>
              {product.promotion && product.stock > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                  {product.promotion}
                </span>
              )}
              {product.stock === 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-zinc-900 text-white">
                  Sold Out
                </span>
              )}
              <span className="text-zinc-400 text-xs font-medium">{product.category}</span>
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 mb-4">{product.name}</h1>
          </div>

          <div className="flex items-baseline space-x-4">
            <div className="text-3xl font-bold text-zinc-900">
              {`R${(product.price || 0).toLocaleString()}`}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-xl text-red-400 line-through font-bold">
                Was R{product.originalPrice.toLocaleString()}
              </div>
            )}
          </div>

          <p className="text-zinc-600 leading-relaxed text-lg">{product.description}</p>

          {product.type === 'refurbished' && (
            <div className="grid grid-cols-2 gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Model</p>
                  <p className="text-sm font-bold text-zinc-900">{product.model || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Condition</p>
                  <p className="text-sm font-bold text-zinc-900">{product.condition || 'Good'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Refurbished Date</p>
                  <p className="text-sm font-bold text-zinc-900">{product.refurbishedDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {product.type === 'pouch' && (
            <div className="grid grid-cols-2 gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Type</p>
                  <p className="text-sm font-bold text-zinc-900">Phone Pouch</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase">Protection</p>
                  <p className="text-sm font-bold text-zinc-900">High Quality</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-bold">{warranty}</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button 
              onClick={() => handleBuyNow(product.price)}
              disabled={product.stock === 0}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                product.stock === 0 
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-200'
              }`}
            >
              {product.stock === 0 ? 'Sold Out' : 'Buy Now'}
            </button>
          </div>
        </motion.div>
      </div>

      <div className="border-t border-zinc-100 pt-16">
        <h2 className="text-2xl font-bold text-zinc-900 mb-8">Customer Reviews</h2>
        
        <div className="space-y-6">
          {ratings.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
              <p className="text-zinc-400">No reviews yet. Only verified buyers can leave a review from their dashboard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ratings.map((rating) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={rating.id}
                  className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                        {rating.userName[0]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-zinc-900">{rating.userName}</p>
                          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={8} />
                            <span>Verified Purchase</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {formatDate(rating.createdAt)}
                        </p>
                      </div>
                    </div>
                    <RatingStars rating={rating.rating} size={12} />
                  </div>
                  <p className="text-zinc-600 leading-relaxed">{rating.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          product={product}
          price={checkoutPrice}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
};

export default ProductDetails;
