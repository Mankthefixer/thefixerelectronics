import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetails from './components/ProductDetails';
import AdminPanel from './components/AdminPanel';
import UserDashboard from './components/UserDashboard';
import AboutDeveloper from './components/AboutDeveloper';
import RatingsTab from './components/RatingsTab';
import AuthPage from './components/AuthPage';
import { Product } from './types';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, AlertCircle, X } from 'lucide-react';

// Error Boundary Component
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-bold text-zinc-900 mb-2">Notice</h1>
            <p className="text-zinc-500 mb-6">
              We're experiencing a brief connection issue. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-zinc-900 text-white px-8 py-3 rounded-full font-medium hover:bg-zinc-800 transition-all"
            >
              Refresh Website
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Storefront: React.FC = () => {
  const { profile, loading: authLoading, signIn } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [view, setView] = useState<'shop' | 'admin' | 'dashboard' | 'about' | 'ratings'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'gadget' | 'refurbished'>('all');
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (error) => {
      import('./firebase').then(({ handleFirestoreError, OperationType }) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      });
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Account Suspended</h1>
          <p className="text-zinc-500">Your account has been suspended by the administrator. Please contact support for more information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar 
        onAdminClick={() => setView('admin')} 
        onHomeClick={() => { setView('shop'); setSelectedProduct(null); }} 
        onDashboardClick={() => setView('dashboard')}
        onAboutClick={() => setView('about')}
        onRatingsClick={() => setView('ratings')}
        onAuthClick={() => setShowAuth(true)}
      />

      <main>
        {view === 'admin' ? (
          <AdminPanel />
        ) : view === 'dashboard' ? (
          <UserDashboard />
        ) : view === 'about' ? (
          <AboutDeveloper />
        ) : view === 'ratings' ? (
          <RatingsTab />
        ) : selectedProduct ? (
          <ProductDetails 
            product={selectedProduct} 
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <header className="mb-12 text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-black text-zinc-900 mb-4 tracking-tight"
              >
                Upgrade Your Tech.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-zinc-500 text-lg max-w-2xl mx-auto"
              >
                Premium gadgets and certified refurbished phones at the best fixed prices.
              </motion.p>
            </header>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-12">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
                <input
                  type="text"
                  placeholder="Search gadgets, phones, models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border border-black/5 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition-all text-zinc-400 hover:text-zinc-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                {(['all', 'gadget', 'refurbished'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-6 py-4 rounded-2xl font-bold capitalize transition-all shadow-sm ${
                      filter === t ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-zinc-400 text-lg">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={product.id}
                    >
                      <ProductCard product={product} onClick={setSelectedProduct} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-zinc-950 text-zinc-400 py-12 mt-20 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-white font-black text-lg tracking-tight">Thefixer Electronics</span>
            <p className="text-xs text-zinc-500 mt-1">© {new Date().getFullYear()} www.thefixer2000@gmail.com. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-sm font-bold">
            <button onClick={() => { setView('shop'); setSelectedProduct(null); }} className="hover:text-white transition-colors cursor-pointer">Shop</button>
            <button onClick={() => setView('about')} className="hover:text-white transition-colors cursor-pointer">About Developer</button>
            <button onClick={() => setView('ratings')} className="hover:text-white transition-colors cursor-pointer">Reviews</button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showAuth && (
          <AuthPage onClose={() => setShowAuth(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Storefront />
      </AuthProvider>
    </ErrorBoundary>
  );
}
