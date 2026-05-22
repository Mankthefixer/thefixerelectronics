import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, formatDate } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Rating } from '../types';
import { Star, MessageSquare, ShoppingBag, User } from 'lucide-react';
import RatingStars from './RatingStars';
import { motion } from 'motion/react';

const RatingsTab: React.FC = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ratings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedRatings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
      setRatings(fetchedRatings);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ratings');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 border-4 border-zinc-900/10 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-zinc-900 mb-4">Customer Experience</h1>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          See what our community is saying about their latest tech finds from Thefixer Electronics.
        </p>
      </div>

      {ratings.length === 0 ? (
        <div className="bg-white p-16 rounded-[3rem] border border-dashed border-zinc-200 text-center">
          <MessageSquare size={48} className="mx-auto text-zinc-200 mb-4" />
          <p className="text-zinc-400 font-bold">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ratings.map((review, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={review.id}
              className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 font-black">
                    {review.userName[0]}
                  </div>
                  <div>
                    <p className="font-black text-zinc-900">{review.userName}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 px-2 py-1 rounded-lg">
                  <RatingStars rating={review.rating} size={10} />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-2 text-emerald-600 mb-2">
                  <ShoppingBag size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified Purchase</span>
                </div>
                <h3 className="font-black text-zinc-900 group-hover:text-emerald-600 transition-colors">
                  {(review as any).productName || 'Product'}
                </h3>
              </div>

              <p className="text-zinc-600 text-sm leading-relaxed italic">
                "{review.comment}"
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingsTab;
