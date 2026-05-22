import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, CheckCircle2, Truck, ShieldCheck, MapPin, Phone, Banknote, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface CheckoutModalProps {
  product: Product;
  price: number;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ product, price, onClose }) => {
  const { profile } = useAuth();
  const [step, setStep] = useState<'summary' | 'payment' | 'delivery' | 'processing' | 'success'>('summary');
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod');
  const [town, setTown] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [place, setPlace] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warranty, setWarranty] = useState('12-Month Thefixer Warranty');

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'developerInfo'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.warranty) setWarranty(data.warranty);
      }
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (profile?.address) {
      // Try to parse existing address if it follows our new format "House: X, Place: Y, Town: Z"
      const addr = profile.address;
      const houseMatch = addr.match(/House: (.*?),/);
      const placeMatch = addr.match(/Place: (.*?),/);
      const townMatch = addr.match(/Town: (.*?)$/);
      
      if (houseMatch) setHouseNumber(houseMatch[1]);
      if (placeMatch) setPlace(placeMatch[1]);
      if (townMatch) setTown(townMatch[1]);
      
      // Fallback if not in format
      if (!houseMatch && !placeMatch && !townMatch) {
        setTown(addr);
      }
    }
    if (profile?.phoneNumber) setPhoneNumber(profile.phoneNumber);
  }, [profile]);

  const handleConfirmOrder = async () => {
    setStep('processing');
    
    try {
      setError(null);
      const fullAddress = `House: ${houseNumber}, Place: ${place}, Town: ${town}`;
      
      // Update user profile with new address/phone if changed
      if (profile && (fullAddress !== profile.address || phoneNumber !== profile.phoneNumber)) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          address: fullAddress,
          phoneNumber
        });
      }

      // Create Order in Firestore
      if (profile) {
        const orderData = {
          userId: profile.uid,
          productId: product.id,
          productName: product.name,
          productImageUrl: product.imageUrl,
          price: price,
          status: 'placed',
          paymentMethod: 'cod',
          address: fullAddress,
          phoneNumber: phoneNumber,
          brand: product.category,
          model: product.model || product.name,
          createdAt: serverTimestamp(),
          paymentStatus: 'pending'
        };
        await addDoc(collection(db, 'orders'), orderData);
      }

      // COD path
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep('success');
    } catch (error) {
      console.error('Checkout error:', error);
      setError('There was an error processing your order. Please try again.');
      setStep('delivery');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-black/5 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              {step !== 'summary' && step !== 'processing' && step !== 'success' && (
                <button 
                  onClick={() => setStep(step === 'payment' ? 'summary' : 'payment')}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-zinc-400" />
                </button>
              )}
              <h2 className="text-xl font-black text-zinc-900">
                {step === 'summary' && 'Order Summary'}
                {step === 'payment' && 'Payment Method'}
                {step === 'delivery' && 'Delivery Details'}
                {step === 'processing' && 'Processing'}
                {step === 'success' && 'Success'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <X className="h-6 w-6 text-zinc-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {step === 'summary' && (
              <div className="p-8 space-y-8">
                <div className="flex items-center space-x-4 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <img src={product.imageUrl} alt="" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                  <div>
                    <p className="font-black text-zinc-900 text-lg">{product.name}</p>
                    <p className="text-zinc-500 font-bold">R{(price || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                    <div className="bg-emerald-100 p-2 rounded-xl">
                      <Truck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700">Free Thefixer Delivery (Within 24 Hours)</span>
                  </div>
                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                    <div className="bg-blue-100 p-2 rounded-xl">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700">{warranty}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-zinc-400 font-black uppercase tracking-widest text-xs">Total Amount</span>
                    <span className="text-3xl font-black text-zinc-900">R{(price || 0).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => setStep('payment')}
                    className="w-full bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center space-x-2"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="p-8 space-y-6 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Banknote className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-zinc-900">Cash on Delivery</h3>
                <p className="text-zinc-500 font-medium">
                  We currently only accept Cash on Delivery. Please have your cash ready when your order arrives!
                </p>
                
                <div className="pt-8">
                  <button
                    onClick={() => setStep('delivery')}
                    className="w-full bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center space-x-2"
                  >
                    <span>Continue to Delivery</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {step === 'delivery' && (
              <div className="p-8 space-y-6">
                <p className="text-zinc-500 font-medium text-center mb-4">Where should we send your new tech?</p>
                
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">House Number</label>
                      <input
                        type="text"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="e.g. 123"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Place / Phase</label>
                      <input
                        type="text"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        placeholder="e.g. Phase 5"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Town / City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="text"
                        value={town}
                        onChange={(e) => setTown(e.target.value)}
                        placeholder="e.g. Johannesburg"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+27 12 345 6789"
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={handleConfirmOrder}
                    disabled={!town || !houseNumber || !place || !phoneNumber}
                    className="w-full bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Confirm Order (Cash)</span>
                    <CheckCircle2 size={20} />
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center mt-4 font-bold uppercase tracking-wider">
                    By confirming, you agree to our terms of service
                  </p>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="p-16 text-center space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-zinc-100 rounded-full" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-zinc-900 border-t-transparent rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-zinc-900">Finalizing Order</h2>
                  <p className="text-zinc-500">Securing your tech upgrade...</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="p-16 text-center space-y-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-zinc-900">Order Placed!</h2>
                  <p className="text-zinc-500">
                    Thank you for choosing Thefixer Electronics. 
                    Please have your cash ready for delivery.
                  </p>
                  <div className="mt-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Shipping to</p>
                    <p className="text-sm font-bold text-zinc-900">{`House: ${houseNumber}, Place: ${place}, Town: ${town}`}</p>
                    <p className="text-xs text-zinc-500 mt-1">{phoneNumber}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-lg"
                >
                  Back to Shop
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
