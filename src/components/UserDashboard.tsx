import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Rating, Order } from '../types';
import { db, handleFirestoreError, OperationType, formatDate, formatTime } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, Timestamp, addDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { User, MessageSquare, Star, Settings, Signature, Clock, CheckCircle2, XCircle, Edit2, Check, X, ChevronRight, ShoppingBag, AlertCircle, MapPin, Phone, Banknote, Send } from 'lucide-react';
import RatingStars from './RatingStars';
import CheckoutModal from './CheckoutModal';
import Toast from './Toast';

const UserDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'reviews'>('overview');
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{ product: any, price: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editTown, setEditTown] = useState('');
  const [editHouseNumber, setEditHouseNumber] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (!profile) return;

    const reviewsQuery = query(
      collection(db, 'ratings'),
      where('userId', '==', profile.uid)
    );

    const unsubReviews = onSnapshot(reviewsQuery, (snap) => {
      const revs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rating));
      setReviews(revs.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ratings');
    });

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', profile.uid)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const ords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    setLoading(false);
    return () => {
      unsubReviews();
      unsubOrders();
    };
  }, [profile]);

  useEffect(() => {
    if (profile?.address) {
      const addr = profile.address;
      const houseMatch = addr.match(/House: (.*?),/);
      const placeMatch = addr.match(/Place: (.*?),/);
      const townMatch = addr.match(/Town: (.*?)$/);
      
      if (houseMatch) setEditHouseNumber(houseMatch[1]);
      if (placeMatch) setEditPlace(placeMatch[1]);
      if (townMatch) setEditTown(townMatch[1]);
      
      if (!houseMatch && !placeMatch && !townMatch) {
        setEditTown(addr);
      }
    }
  }, [profile?.address]);

  const handleSaveAddress = async () => {
    if (!profile) return;
    setIsSavingAddress(true);
    try {
      const fullAddress = `House: ${editHouseNumber}, Place: ${editPlace}, Town: ${editTown}`;
      await updateDoc(doc(db, 'users', profile.uid), {
        address: fullAddress
      });
      setIsEditingAddress(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleBuyNow = (product: any, price: number) => {
    setCheckoutData({ 
      product, 
      price 
    });
    setShowCheckout(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reviewOrder) return;

    setSubmittingReview(true);
    try {
      // Add the rating
      await addDoc(collection(db, 'ratings'), {
        productId: reviewOrder.productId,
        productName: reviewOrder.productName,
        userId: profile.uid,
        userName: profile.displayName,
        rating: newRating,
        comment,
        createdAt: serverTimestamp(),
      });

      // Update product rating count and average (simplified)
      const productRef = doc(db, 'products', reviewOrder.productId);
      await updateDoc(productRef, {
        ratingCount: increment(1)
      });

      setShowReviewModal(false);
      setReviewOrder(null);
      setComment('');
      setNewRating(5);
      setActiveTab('reviews');
      setToast({ message: 'Review posted successfully!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ratings');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" className="h-24 w-24 rounded-3xl border-4 border-zinc-50 shadow-lg object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-24 w-24 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <User size={48} />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg">
                <Settings size={16} />
              </div>
            </div>
            <h2 className="text-xl font-black text-zinc-900">{profile.displayName}</h2>
            <p className="text-sm text-zinc-500 mb-6">{profile.email}</p>
            <div className="flex justify-center space-x-2">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {profile.role}
              </span>
              {profile.isSuspended && (
                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Suspended
                </span>
              )}
            </div>
          </div>

          <nav className="bg-white p-4 rounded-[2rem] border border-black/5 shadow-sm space-y-2">
            {[
              { id: 'overview', icon: User, label: 'Overview' },
              { id: 'orders', icon: ShoppingBag, label: 'My Orders' },
              { id: 'reviews', icon: Star, label: 'My Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <tab.icon size={20} />
                  <span className="font-bold">{tab.label}</span>
                </div>
                <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
                    <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-2">Total Reviews</p>
                    <p className="text-4xl font-black text-zinc-900">{reviews.length}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
                    <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-2">Member Since</p>
                    <p className="text-xl font-black text-zinc-900">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                  {(profile.address || profile.phoneNumber) && (
                    <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm md:col-span-2">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Delivery Information</p>
                        {!isEditingAddress && (
                          <button 
                            onClick={() => setIsEditingAddress(true)}
                            className="p-2 hover:bg-zinc-50 rounded-xl text-zinc-400 hover:text-zinc-900 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {profile.address && (
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Address</p>
                              {isEditingAddress ? (
                                <div className="mt-2 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <input
                                      type="text"
                                      value={editHouseNumber}
                                      onChange={(e) => setEditHouseNumber(e.target.value)}
                                      placeholder="House #"
                                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                                    />
                                    <input
                                      type="text"
                                      value={editPlace}
                                      onChange={(e) => setEditPlace(e.target.value)}
                                      placeholder="Place/Phase"
                                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={editTown}
                                    onChange={(e) => setEditTown(e.target.value)}
                                    placeholder="Town/City"
                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleSaveAddress}
                                      disabled={isSavingAddress}
                                      className="flex-1 bg-zinc-900 text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-50"
                                    >
                                      {isSavingAddress ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setIsEditingAddress(false)}
                                      className="flex-1 bg-zinc-100 text-zinc-600 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-zinc-900 font-bold">{profile.address}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {profile.phoneNumber && (
                          <div className="flex items-start space-x-3">
                            <Phone className="h-5 w-5 text-zinc-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Phone</p>
                              <p className="text-zinc-900 font-bold">{profile.phoneNumber}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
                  <h3 className="text-xl font-black text-zinc-900 mb-6">Recent Reviews</h3>
                  {reviews.length === 0 ? (
                    <p className="text-zinc-400 text-center py-12">No recent reviews to show.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map(review => (
                        <div key={review.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                              <Star size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">Review for {(review as any).productName || 'Product'}</p>
                              <p className="text-xs text-zinc-500">{review.rating} Stars</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-zinc-900">My Orders</h3>
                  <div className="flex space-x-2">
                    <div className="flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Clock size={12} />
                      <span>{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} Active</span>
                    </div>
                    <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <CheckCircle2 size={12} />
                      <span>{orders.filter(o => o.status === 'delivered').length} Delivered</span>
                    </div>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-zinc-200 text-center">
                    <ShoppingBag size={48} className="mx-auto text-zinc-200 mb-4" />
                    <p className="text-zinc-400">You haven't placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Orders */}
                    {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-4">Active Orders</h4>
                        {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(order => (
                          <button 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className="w-full text-left bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <img src={order.productImageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                                <div>
                                  <p className="font-black text-zinc-900 group-hover:text-emerald-600 transition-colors">{order.productName}</p>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm text-zinc-500 font-bold">R{order.price.toLocaleString()}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                      order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : 
                                      order.paymentMethod === 'cod' ? 'bg-zinc-100 text-zinc-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                      {order.paymentStatus === 'paid' ? 'Paid' : 
                                       order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Awaiting Payment'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                                  order.status === 'preparing' ? 'bg-amber-100 text-amber-600' :
                                  'bg-zinc-100 text-zinc-600'
                                }`}>
                                  {order.status === 'placed' ? 'Order Placed' :
                                   order.status === 'preparing' ? 'Preparing Order' :
                                   order.status === 'shipped' ? 'On the Way' :
                                   order.status}
                                </span>
                                <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                            
                            {/* Status Progress Bar */}
                            <div className="relative h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div 
                                className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                  order.status === 'shipped' ? 'bg-blue-500 w-3/4' :
                                  order.status === 'preparing' ? 'bg-amber-500 w-1/2' :
                                  'bg-zinc-900 w-1/4'
                                }`}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Past Orders */}
                    {(orders.filter(o => o.status === 'delivered').length > 0 || orders.filter(o => o.status === 'cancelled').length > 0) && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-4">Past Orders</h4>
                        {orders.filter(o => o.status === 'delivered' || o.status === 'cancelled').map(order => (
                          <button 
                            key={order.id} 
                            onClick={() => setSelectedOrder(order)}
                            className="w-full text-left bg-zinc-50 p-6 rounded-3xl border border-zinc-100 opacity-75 hover:opacity-100 transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <img src={order.productImageUrl} alt="" className="h-12 w-12 rounded-xl object-cover grayscale" />
                                <div>
                                  <p className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{order.productName}</p>
                                  <p className="text-xs text-zinc-500">R{order.price.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                  {order.status}
                                </span>
                                <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">{formatDate(order.createdAt)}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-black text-zinc-900 mb-6">My Reviews</h3>
                {reviews.length === 0 ? (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-zinc-200 text-center">
                    <Star size={48} className="mx-auto text-zinc-200 mb-4" />
                    <p className="text-zinc-400">You haven't written any reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-zinc-900">{(review as any).productName || 'Product Review'}</h4>
                            <div className="flex items-center mt-1">
                              <RatingStars rating={review.rating} size={12} />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <p className="text-zinc-600 text-sm italic">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showCheckout && checkoutData && (
        <CheckoutModal
          product={checkoutData.product}
          price={checkoutData.price}
          onClose={() => setShowCheckout(false)}
        />
      )}
      {/* Order Receipt Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              {/* Receipt Header */}
              <div className="p-8 bg-zinc-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black mb-1">Order Receipt</h2>
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">ID: {selectedOrder.id.slice(0, 8)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Status Banner */}
                <div className={`p-4 rounded-2xl flex items-center justify-between ${
                  selectedOrder.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                  selectedOrder.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  <div className="flex items-center space-x-3">
                    {selectedOrder.status === 'delivered' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    <span className="font-black uppercase text-xs tracking-wider">
                      {selectedOrder.status === 'placed' ? 'Order Placed' :
                       selectedOrder.status === 'preparing' ? 'Preparing Order' :
                       selectedOrder.status === 'shipped' ? 'On the Way' :
                       selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold opacity-70 uppercase">{formatDate(selectedOrder.createdAt)}</p>
                </div>

                {/* Product Info */}
                <div className="flex items-center space-x-6 p-4 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <img src={selectedOrder.productImageUrl} alt="" className="h-24 w-24 rounded-2xl object-cover shadow-sm" />
                  <div>
                    <h4 className="text-lg font-black text-zinc-900 leading-tight">{selectedOrder.productName}</h4>
                    <p className="text-emerald-600 font-black text-xl mt-1">R{selectedOrder.price.toLocaleString()}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payment Method</p>
                    <div className="flex items-center space-x-2 text-zinc-900 font-bold">
                      <Banknote size={14} />
                      <span className="uppercase">{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-zinc-900 font-bold">{selectedOrder.phoneNumber}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Delivery Address</p>
                  <div className="flex items-start space-x-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <MapPin size={18} className="text-zinc-400 mt-0.5" />
                    <p className="text-zinc-900 font-medium leading-relaxed">{selectedOrder.address}</p>
                  </div>
                </div>

                {/* Package Details */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Device Details</p>
                  <div className="p-4 border border-dashed border-zinc-200 rounded-2xl space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Brand</span>
                      <span className="font-bold text-zinc-900 uppercase">{selectedOrder.brand || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Model</span>
                      <span className="font-bold text-zinc-900">{selectedOrder.model || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Carrier</span>
                      <span className="font-bold text-zinc-900">Thefixer Electronics</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Delivery Time</span>
                      <span className="font-bold text-emerald-600 uppercase tracking-tighter">Within 24 Hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex flex-col space-y-3">
                {selectedOrder.status === 'delivered' && (
                  <button 
                    onClick={() => {
                      setReviewOrder(selectedOrder);
                      setShowReviewModal(true);
                      setSelectedOrder(null);
                    }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center space-x-2"
                  >
                    <Star size={16} />
                    <span>Rate & Review Product</span>
                  </button>
                )}
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && reviewOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-zinc-900 text-white">
                <h2 className="text-2xl font-black">Write a Review</h2>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">{reviewOrder.productName}</p>
              </div>
              <form onSubmit={handleSubmitReview} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-4">Rating</label>
                  <div className="flex justify-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <RatingStars rating={newRating} onRatingChange={setNewRating} interactive size={32} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-4">Your Experience</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all min-h-[120px] resize-none"
                    placeholder="What did you think of the product?"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Post</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;
