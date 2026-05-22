import React, { useState, useEffect, useRef } from 'react';
import { Product, UserProfile, Order, OrderStatus } from '../types';
import { db, handleFirestoreError, OperationType, formatDate, formatTime } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc, serverTimestamp, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Users, Package, Check, X, ShieldAlert, Camera, Upload, ImageIcon, AlertTriangle, Clock, ShoppingBag, CheckCircle2, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'orders' | 'settings'>('products');
  const [productFilter, setProductFilter] = useState<'all' | 'gadget' | 'refurbished' | 'pouch'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);
  
  // Settings state
  const [devInfo, setDevInfo] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const ords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords.sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds || 0;
        const timeB = (b.createdAt as any)?.seconds || 0;
        return timeB - timeA;
      }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'developerInfo'), (doc) => {
      if (doc.exists()) {
        setDevInfo(doc.data());
      } else {
        setDevInfo({
          name: 'Thefixer',
          title: 'Electrical Engineer & Developer',
          qualifications: [
            { title: 'BEng Tech in Electrical Engineering', subtitle: 'University of Johannesburg (UJ)', icon: 'GraduationCap' },
            { title: 'Professional Electrical Engineer', subtitle: 'Specializing in Electronics & Tech Solutions', icon: 'Award' }
          ],
          about: 'I am a passionate Electrical Engineer with a deep interest in bridging the gap between hardware and software. With my background from UJ, I bring a technical precision to every project I build. Thefixer Electronics is a testament to my commitment to quality, sustainability, and innovation in the tech space.',
          quote: 'My goal is to provide high-quality gadgets and refurbished tech that people can trust, backed by engineering expertise.',
          email: '',
          linkedin: '',
          whatsapp: '',
          warranty: '12-Month Thefixer Warranty'
        });
      }
    });

    return () => {
      unsubProducts();
      unsubUsers();
      unsubOrders();
      unsubSettings();
    };
  }, []);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'developerInfo'), devInfo);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/developerInfo');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleSuspension = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { isSuspended: !user.isSuspended });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSeedData = async () => {
    const sampleProducts = [
      {
        name: 'iPhone 13 Pro',
        type: 'refurbished',
        description: 'Excellent condition refurbished iPhone 13 Pro with 256GB storage.',
        price: 12500,
        category: 'Phones',
        stock: 5,
        rating: 4.8,
        ratingCount: 12,
        model: 'A2483',
        refurbishedDate: '2024-01-15',
        condition: 'Excellent',
        imageUrl: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=400',
        createdAt: serverTimestamp(),
      },
      {
        name: 'Sony WH-1000XM5',
        type: 'gadget',
        description: 'Industry-leading noise canceling headphones with exceptional sound quality.',
        price: 6500,
        category: 'Audio',
        stock: 10,
        rating: 4.9,
        ratingCount: 45,
        imageUrl: 'https://images.unsplash.com/photo-1648447226217-0427af65f2b7?auto=format&fit=crop&q=80&w=400',
        createdAt: serverTimestamp(),
      },
      {
        name: 'Samsung Galaxy S22',
        type: 'refurbished',
        description: 'Good condition refurbished Galaxy S22. Minor scratches on the back.',
        price: 8900,
        category: 'Phones',
        stock: 3,
        rating: 4.2,
        ratingCount: 8,
        model: 'SM-S901U',
        refurbishedDate: '2023-11-20',
        condition: 'Good',
        imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400',
        createdAt: serverTimestamp(),
      }
    ];

    try {
      for (const p of sampleProducts) {
        await addDoc(collection(db, 'products'), p);
      }
      console.log('Sample data added successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, 'products', confirmDelete.id));
      setConfirmDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${confirmDelete.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-zinc-200">
        <div className="flex space-x-4">
          {[
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 font-bold transition-all border-b-2 ${
                activeTab === tab.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleSeedData}
          className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          Seed Sample Data
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-zinc-900">Manage Inventory</h2>
              <div className="flex space-x-2">
                {(['all', 'gadget', 'refurbished', 'pouch'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductFilter(type)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      productFilter === type 
                        ? 'bg-zinc-900 text-white' 
                        : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {type === 'all' ? 'All Items' : type === 'gadget' ? 'Gadgets' : type === 'refurbished' ? 'Phones' : 'Pouches'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setEditingProduct(null); setShowProductForm(true); }}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-zinc-800 transition-all font-bold"
            >
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter(p => productFilter === 'all' || p.type === productFilter)
              .map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-2xl border border-zinc-200 flex justify-between items-start">
                <div className="flex space-x-4">
                  <img src={product.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover bg-zinc-100" />
                  <div>
                    <h3 className="font-bold text-zinc-900">{product.name}</h3>
                    <p className="text-sm text-zinc-500">R{product.price}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      product.type === 'refurbished' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {product.type}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setEditingProduct(product); setShowProductForm(true); }}
                    className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete({ id: product.id, name: product.name })}
                    className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                      <div>
                        <p className="font-bold text-zinc-900">{user.displayName}</p>
                        <p className="text-xs text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isSuspended ? (
                      <span className="flex items-center text-red-600 text-xs font-bold">
                        <ShieldAlert className="h-4 w-4 mr-1" /> Suspended
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleSuspension(user)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        user.isSuspended ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-zinc-900">Manage Orders</h2>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Clock size={12} />
                <span>{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} Active</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 size={12} />
                <span>{orders.filter(o => o.status === 'delivered').length} Delivered</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Order Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={order.productImageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-zinc-900">{order.productName}</p>
                          <p className="text-xs text-zinc-500">
                            R{order.price.toLocaleString()} • {order.paymentMethod.toUpperCase()}
                            <span className={`ml-2 font-bold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              ({order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'})
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-bold text-zinc-900">{users.find(u => u.uid === order.userId)?.displayName || 'Unknown'}</p>
                        <p className="text-zinc-500 truncate max-w-[150px]">{order.address}</p>
                        <p className="text-zinc-500">{order.phoneNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'placed' ? 'bg-zinc-100 text-zinc-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {order.status === 'placed' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                            className="text-[10px] font-black uppercase px-3 py-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all"
                          >
                            Prepare
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}
                            className="text-[10px] font-black uppercase px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                          >
                            Ship
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                            className="text-[10px] font-black uppercase px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                          >
                            Deliver
                          </button>
                        )}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="text-[10px] font-black uppercase px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && devInfo && (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-8">
          <h3 className="text-xl font-black text-zinc-900 mb-6">Developer Settings</h3>
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Developer Name</label>
                <input
                  type="text"
                  value={devInfo.name}
                  onChange={(e) => setDevInfo({ ...devInfo, name: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Title</label>
                <input
                  type="text"
                  value={devInfo.title}
                  onChange={(e) => setDevInfo({ ...devInfo, title: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">About Me</label>
              <textarea
                value={devInfo.about}
                onChange={(e) => setDevInfo({ ...devInfo, about: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Personal Quote</label>
              <textarea
                value={devInfo.quote}
                onChange={(e) => setDevInfo({ ...devInfo, quote: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Warranty Information</label>
              <input
                type="text"
                value={devInfo.warranty || ''}
                onChange={(e) => setDevInfo({ ...devInfo, warranty: e.target.value })}
                placeholder="e.g. 12-Month Thefixer Warranty"
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">Email</label>
                <input
                  type="email"
                  value={devInfo.email}
                  onChange={(e) => setDevInfo({ ...devInfo, email: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">
                  WhatsApp Number <span className="text-red-500 font-black">(Include Country Code)</span>
                </label>
                <input
                  type="text"
                  value={devInfo.whatsapp}
                  onChange={(e) => setDevInfo({ ...devInfo, whatsapp: e.target.value })}
                  placeholder="e.g. 27793112370"
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
                />
                <p className="text-[9px] text-zinc-400 ml-4 font-bold italic">Example: 27793112370 (No '+' or spaces)</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">LinkedIn URL</label>
              <input
                type="text"
                value={devInfo.linkedin}
                onChange={(e) => setDevInfo({ ...devInfo, linkedin: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-zinc-900 transition-all"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving...' : 'Save Developer Info'}
            </button>
          </div>
        </div>
      )}

      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowProductForm(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteProduct}
        onCancel={() => setConfirmDelete(null)}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

const ProductFormModal: React.FC<{ product: Product | null; onClose: () => void }> = ({ product, onClose }) => {
  const [formData, setFormData] = useState<Partial<Product>>(product || {
    name: '',
    type: 'gadget',
    description: '',
    price: 0,
    originalPrice: 0,
    promotion: '',
    category: '',
    stock: 1,
    imageUrl: '',
    specs: {},
    rating: 5,
    ratingCount: 0,
  });

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFormData({ ...formData, imageUrl: dataUrl });
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (product) {
        await updateDoc(doc(db, 'products', product.id), { ...formData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'products'), { ...formData, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-zinc-900">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="gadget">Gadget</option>
                <option value="refurbished">Refurbished Phone</option>
                <option value="pouch">Pouch</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900 min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Price (R)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Original Price (R)</label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Promotion</label>
              <select
                value={formData.promotion}
                onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="">None</option>
                <option value="Buy 1 Get 1 Free">Buy 1 Get 1 Free</option>
                <option value="Free Delivery">Free Delivery</option>
                <option value="10% Off">10% Off</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Stock</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase">Product Image</label>
            <div className="flex flex-col space-y-4">
              {formData.imageUrl && !showCamera && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-600 hover:bg-white transition-all shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {showCamera && (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-900 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-white text-zinc-900 p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-red-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              )}

              {!showCamera && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="font-bold">Take Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="font-bold">Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="Or paste image URL..."
                />
              </div>
            </div>
          </div>

          {formData.type === 'refurbished' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-700 uppercase">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-700 uppercase">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-bold text-emerald-700 uppercase">Refurbished Date</label>
                <input
                  type="date"
                  value={formData.refurbishedDate}
                  onChange={(e) => setFormData({ ...formData, refurbishedDate: e.target.value })}
                  className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
          >
            {product ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;
