import React, { useState, useEffect } from 'react';
import { useFirebase, OperationType, handleFirestoreError } from '../contexts/FirebaseContext';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { supabase, SUPABASE_BUCKET } from '../supabase';
import imageCompression from 'browser-image-compression';
import { Product, SiteContent } from '../types';
import { cn } from '../utils';
import { Plus, Edit2, Trash2, Loader2, X, Save, Image as ImageIcon, ArrowLeft, Database, Lock, ShieldCheck, User, Settings, Package, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data';
import { useSiteContent } from '../hooks/useSiteContent';

const ADMIN_PASSWORD = (import.meta as any).env.VITE_ADMIN_PASSWORD || 'admin123';

export default function AdminPage() {
  const { profile, loading: authLoading, signIn } = useFirebase();
  const { content: siteContent, updateContent: updateSiteContent, loading: siteLoading } = useSiteContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'site'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [siteFormData, setSiteFormData] = useState<SiteContent>(siteContent);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    image: '',
    description: '',
    stock: 0
  });

  const handleFileUpload = async (file: File, path: string) => {
    if (!profile) {
      alert('You must be logged in as an admin to upload files.');
      signIn();
      return null;
    }
    
    setIsUploading(true);
    try {
      let fileToUpload = file;

      // Only compress if it's an image and not a GIF (GIF compression is complex client-side)
      if (file.type.startsWith('image/') && !file.type.includes('gif')) {
        console.log('Compressing image extremely...');
        const options = {
          maxSizeMB: 0.1, // Super extreme compression (100KB target)
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          initialQuality: 0.5,
        };
        
        try {
          const compressedFile = await imageCompression(file, options);
          console.log(`Compression complete: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
          fileToUpload = compressedFile;
        } catch (compressionError) {
          console.warn('Compression failed, uploading original:', compressionError);
        }
      }

      console.log(`Starting Supabase upload to ${path}...`);
      const fileName = `${path}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(fileName);

      console.log('Supabase upload successful:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('Supabase upload failed details:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}. Make sure your Supabase bucket "${SUPABASE_BUCKET}" exists and is public.`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!siteLoading) {
      setSiteFormData(siteContent);
    }
  }, [siteLoading, siteContent]);

  useEffect(() => {
    const productsPath = 'products';
    const unsubscribe = onSnapshot(collection(db, productsPath), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, productsPath);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-gray-500">Please sign in with your administrator account.</p>
          </div>
          <button
            onClick={() => signIn()}
            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            Sign In with Google
          </button>
          <Link to="/" className="block text-sm text-gray-400 hover:text-black transition-colors">
            Return to Store
          </Link>
        </motion.div>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-gray-500">Your account ({profile?.email}) does not have administrator privileges.</p>
          </div>
          <div className="pt-4">
            <Link to="/" className="inline-block w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors">
              Return to Store
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Verification</h1>
            <p className="text-gray-500 text-sm">Please enter the security code to continue.</p>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === ADMIN_PASSWORD) {
                setIsUnlocked(true);
                setPasswordError(false);
              } else {
                setPasswordError(true);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                placeholder="Enter security code"
                className={`w-full bg-gray-50 border ${passwordError ? 'border-red-500' : 'border-transparent'} rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all text-center text-lg tracking-widest`}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-500 text-xs text-center font-medium">Incorrect security code. Please try again.</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors"
            >
              Verify & Unlock
            </button>
            <Link to="/" className="block text-center text-sm text-gray-400 hover:text-black transition-colors">
              Cancel
            </Link>
          </form>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productsPath = 'products';
    try {
      if (editingProduct) {
        await updateDoc(doc(db, productsPath, editingProduct.id), formData);
      } else {
        await addDoc(collection(db, productsPath), {
          ...formData,
          id: Date.now().toString(), // Firestore will generate its own ID, but we keep this for consistency if needed
          rating: 0,
          reviews: 0
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: 0, category: '', image: '', description: '', stock: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productsPath);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const productsPath = 'products';
    try {
      await deleteDoc(doc(db, productsPath, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, productsPath);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const seedDatabase = async () => {
    if (!window.confirm('This will add the initial sample products and site settings to your database. Continue?')) return;
    const productsPath = 'products';
    try {
      // Seed products
      for (const product of PRODUCTS) {
        const { id, ...data } = product;
        await addDoc(collection(db, productsPath), data);
      }
      // Seed site settings
      await updateSiteContent(siteContent);
      alert('Database seeded successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, productsPath);
    }
  };

  const handleSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteContent(siteFormData);
      alert('Site content updated successfully!');
    } catch (error) {
      console.error('Failed to update site content:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Store
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-500">Manage your store inventory and website content.</p>
            </div>
          </div>

          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'inventory' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('site')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'site' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'
              }`}
            >
              <Settings className="w-4 h-4" />
              Site Settings
            </button>
          </div>
        </div>

        {activeTab === 'inventory' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Product Catalog</h2>
              <div className="flex items-center gap-3">
                {products.length === 0 && (
                  <button
                    onClick={seedDatabase}
                    className="bg-white text-black border border-gray-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <Database className="w-5 h-5" />
                    Seed Sample Data
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({ name: '', price: 0, category: '', image: '', description: '', stock: 0 });
                    setIsModalOpen(true);
                  }}
                  className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Product</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Category</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Price</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Stock</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${product.stock && product.stock < 5 ? 'text-red-500' : 'text-gray-600'}`}>
                            {product.stock || 0} units
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 hover:bg-black hover:text-white rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          >
            <div className="max-w-3xl space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Website Content</h2>
                <p className="text-gray-500 text-sm">Update the text and images across your website.</p>
              </div>

              <form onSubmit={handleSiteSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hero Title</label>
                    <textarea
                      rows={3}
                      value={siteFormData.heroTitle}
                      onChange={(e) => setSiteFormData({ ...siteFormData, heroTitle: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hero Subtitle</label>
                    <textarea
                      rows={3}
                      value={siteFormData.heroSubtitle}
                      onChange={(e) => setSiteFormData({ ...siteFormData, heroSubtitle: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Featured Section Title</label>
                    <input
                      type="text"
                      value={siteFormData.featuredTitle}
                      onChange={(e) => setSiteFormData({ ...siteFormData, featuredTitle: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Featured Section Subtitle</label>
                    <input
                      type="text"
                      value={siteFormData.featuredSubtitle}
                      onChange={(e) => setSiteFormData({ ...siteFormData, featuredSubtitle: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Newsletter Title</label>
                    <input
                      type="text"
                      value={siteFormData.newsletterTitle}
                      onChange={(e) => setSiteFormData({ ...siteFormData, newsletterTitle: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Newsletter Subtitle</label>
                    <input
                      type="text"
                      value={siteFormData.newsletterSubtitle}
                      onChange={(e) => setSiteFormData({ ...siteFormData, newsletterSubtitle: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Newsletter Description</label>
                  <textarea
                    rows={2}
                    value={siteFormData.newsletterDescription}
                    onChange={(e) => setSiteFormData({ ...siteFormData, newsletterDescription: e.target.value })}
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hero Slider Images / GIFs</label>
                    <button
                      type="button"
                      onClick={() => setSiteFormData({
                        ...siteFormData,
                        heroImages: [...siteFormData.heroImages, '']
                      })}
                      className="text-xs font-bold bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Image
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {siteFormData.heroImages.map((url, index) => (
                      <div key={index} className="relative group space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const newImages = [...siteFormData.heroImages];
                              newImages[index] = e.target.value;
                              setSiteFormData({ ...siteFormData, heroImages: newImages });
                            }}
                            placeholder="Image or GIF URL"
                            className="flex-1 bg-gray-50 border border-transparent rounded-xl px-4 py-3 pr-10 focus:outline-none focus:bg-white focus:border-black transition-all"
                          />
                          <label className={cn(
                            "cursor-pointer p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center",
                            isUploading && "opacity-50 cursor-not-allowed"
                          )}>
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const uploadedUrl = await handleFileUpload(file, 'hero');
                                  if (uploadedUrl) {
                                    const newImages = [...siteFormData.heroImages];
                                    newImages[index] = uploadedUrl;
                                    setSiteFormData({ ...siteFormData, heroImages: newImages });
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = siteFormData.heroImages.filter((_, i) => i !== index);
                            setSiteFormData({ ...siteFormData, heroImages: newImages });
                          }}
                          className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {url && (
                          <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-gray-100">
                            <img src={url} alt={`Hero ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Promotional Banners</label>
                    <button
                      type="button"
                      onClick={() => setSiteFormData({
                        ...siteFormData,
                        banners: [...(siteFormData.banners || []), { id: Date.now().toString(), image: '', title: '', subtitle: '', link: '' }]
                      })}
                      className="text-xs font-bold bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Banner
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {(siteFormData.banners || []).map((banner, index) => (
                      <div key={banner.id} className="p-6 bg-gray-50 rounded-2xl space-y-4 relative group">
                        <button
                          type="button"
                          onClick={() => {
                            const newBanners = siteFormData.banners?.filter((_, i) => i !== index);
                            setSiteFormData({ ...siteFormData, banners: newBanners });
                          }}
                          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Banner Title</label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) => {
                                const newBanners = [...(siteFormData.banners || [])];
                                newBanners[index] = { ...banner, title: e.target.value };
                                setSiteFormData({ ...siteFormData, banners: newBanners });
                              }}
                              className="w-full bg-white border border-transparent rounded-xl px-4 py-2 focus:outline-none focus:border-black transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Banner Subtitle</label>
                            <input
                              type="text"
                              value={banner.subtitle}
                              onChange={(e) => {
                                const newBanners = [...(siteFormData.banners || [])];
                                newBanners[index] = { ...banner, subtitle: e.target.value };
                                setSiteFormData({ ...siteFormData, banners: newBanners });
                              }}
                              className="w-full bg-white border border-transparent rounded-xl px-4 py-2 focus:outline-none focus:border-black transition-all"
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Image URL</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={banner.image}
                                onChange={(e) => {
                                  const newBanners = [...(siteFormData.banners || [])];
                                  newBanners[index] = { ...banner, image: e.target.value };
                                  setSiteFormData({ ...siteFormData, banners: newBanners });
                                }}
                                className="flex-1 bg-white border border-transparent rounded-xl px-4 py-2 focus:outline-none focus:border-black transition-all"
                              />
                              <label className="cursor-pointer p-2 bg-white hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center border border-gray-100">
                                <Upload className="w-4 h-4" />
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const uploadedUrl = await handleFileUpload(file, 'banners');
                                      if (uploadedUrl) {
                                        const newBanners = [...(siteFormData.banners || [])];
                                        newBanners[index] = { ...banner, image: uploadedUrl };
                                        setSiteFormData({ ...siteFormData, banners: newBanners });
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Link URL</label>
                            <input
                              type="text"
                              value={banner.link}
                              onChange={(e) => {
                                const newBanners = [...(siteFormData.banners || [])];
                                newBanners[index] = { ...banner, link: e.target.value };
                                setSiteFormData({ ...siteFormData, banners: newBanners });
                              }}
                              className="w-full bg-white border border-transparent rounded-xl px-4 py-2 focus:outline-none focus:border-black transition-all"
                            />
                          </div>
                        </div>
                        {banner.image && (
                          <div className="aspect-[21/9] rounded-xl overflow-hidden bg-white border border-gray-100">
                            <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">About Us Section</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">About Title</label>
                      <input
                        type="text"
                        value={siteFormData.aboutTitle || ''}
                        onChange={(e) => setSiteFormData({ ...siteFormData, aboutTitle: e.target.value })}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">About Text</label>
                      <textarea
                        rows={4}
                        value={siteFormData.aboutText || ''}
                        onChange={(e) => setSiteFormData({ ...siteFormData, aboutText: e.target.value })}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Contact Email</label>
                      <input
                        type="email"
                        value={siteFormData.contactEmail || ''}
                        onChange={(e) => setSiteFormData({ ...siteFormData, contactEmail: e.target.value })}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Contact Phone</label>
                      <input
                        type="text"
                        value={siteFormData.contactPhone || ''}
                        onChange={(e) => setSiteFormData({ ...siteFormData, contactPhone: e.target.value })}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Contact Address</label>
                      <input
                        type="text"
                        value={siteFormData.contactAddress || ''}
                        onChange={(e) => setSiteFormData({ ...siteFormData, contactAddress: e.target.value })}
                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Footer Text</label>
                  <input
                    type="text"
                    value={siteFormData.footerText}
                    onChange={(e) => setSiteFormData({ ...siteFormData, footerText: e.target.value })}
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-50">
                <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Product Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                      placeholder="e.g. Minimalist Watch"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                    <input
                      required
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                      placeholder="e.g. Accessories"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Stock Quantity</label>
                    <input
                      required
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Image URL / Upload</label>
                  <div className="flex gap-4">
                    <div className="flex-1 flex gap-2">
                      <input
                        required
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="flex-1 bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all"
                        placeholder="https://images.unsplash.com/..."
                      />
                      <label className={cn(
                        "cursor-pointer p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}>
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const uploadedUrl = await handleFileUpload(file, 'products');
                              if (uploadedUrl) {
                                setFormData({ ...formData, image: uploadedUrl });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    {formData.image && (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 focus:outline-none focus:bg-white focus:border-black transition-all resize-none"
                    placeholder="Describe the product..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
