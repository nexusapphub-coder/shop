import React, { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import Modal from './components/Modal';
import AdminPage from './pages/AdminPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import { Product, CartItem } from './types';
import { motion } from 'motion/react';
import { getStyleGuide } from './services/gemini';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useFirebase, OperationType, handleFirestoreError } from './contexts/FirebaseContext';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

import { useSiteContent } from './hooks/useSiteContent';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errInfo = JSON.parse(this.state.error.message);
        if (errInfo.error.includes("Missing or insufficient permissions")) {
          message = "You don't have permission to perform this action. Please check your account or contact support.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Application Error</h2>
            <p className="text-gray-500 text-sm">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function HomePage() {
  const { user, profile, loading: authLoading, signIn, logout } = useFirebase();
  const { content: siteContent } = useSiteContent();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [styleGuide, setStyleGuide] = React.useState<{ product: Product; content: string } | null>(null);
  const [isLoadingStyleGuide, setIsLoadingStyleGuide] = React.useState(false);
  const [productsLoading, setProductsLoading] = React.useState(true);

  // Fetch products from Firestore
  useEffect(() => {
    const productsPath = 'products';
    const unsubscribe = onSnapshot(collection(db, productsPath), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
      setProducts(items);
      setProductsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, productsPath);
    });

    return () => unsubscribe();
  }, []);

  // Sync cart with Firestore
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    const cartPath = `users/${user.uid}/cart`;
    const unsubscribe = onSnapshot(collection(db, cartPath), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as CartItem);
      setCartItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, cartPath);
    });

    return () => unsubscribe();
  }, [user]);

  const categories: string[] = ['All', 'Cloths', 'Digital Products', ...products.reduce((acc: string[], p) => {
    if (p.category !== 'Cloths' && p.category !== 'Digital Products' && !acc.includes(p.category)) acc.push(p.category);
    return acc;
  }, [])];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = async (product: Product) => {
    if (!user) {
      signIn();
      return;
    }

    const cartPath = `users/${user.uid}/cart`;
    try {
      const existing = cartItems.find((item) => item.id === product.id);
      if (existing) {
        await updateDoc(doc(db, cartPath, product.id), {
          quantity: existing.quantity + 1
        });
      } else {
        const newItem: CartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          category: product.category,
          description: product.description || '',
          rating: product.rating || 0,
          reviews: product.reviews || 0,
          stock: product.stock || 0
        };
        await setDoc(doc(db, cartPath, product.id), newItem);
      }
      setIsCartOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, cartPath);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    if (!user) return;
    const cartPath = `users/${user.uid}/cart`;
    try {
      const item = cartItems.find(i => i.id === id);
      if (!item) return;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        await deleteDoc(doc(db, cartPath, id));
      } else {
        await updateDoc(doc(db, cartPath, id), {
          quantity: newQuantity
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, cartPath);
    }
  };

  const removeFromCart = async (id: string) => {
    if (!user) return;
    const cartPath = `users/${user.uid}/cart`;
    try {
      await deleteDoc(doc(db, cartPath, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, cartPath);
    }
  };

  const showStyleGuide = async (product: Product) => {
    setIsLoadingStyleGuide(true);
    try {
      const content = await getStyleGuide(product.name, product.category);
      setStyleGuide({ product, content });
    } catch (error) {
      console.error('Failed to get style guide:', error);
    } finally {
      setIsLoadingStyleGuide(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white">
      <Navbar 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)} 
        user={user}
        profile={profile}
        onSignIn={signIn}
        onLogout={logout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />
      
      <main>
        <Hero />

        {siteContent.banners && siteContent.banners.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {siteContent.banners.map((banner) => (
                <Link 
                  key={banner.id} 
                  to={banner.link || '#'} 
                  className="group relative aspect-[16/9] rounded-3xl overflow-hidden bg-gray-100"
                >
                  <img 
                    src={banner.image} 
                    alt={banner.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-8 flex flex-col justify-end">
                    <h3 className="text-white text-2xl font-bold tracking-tight">{banner.title}</h3>
                    {banner.subtitle && <p className="text-white/80 text-sm mt-1">{banner.subtitle}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto px-6 py-24 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">{siteContent.featuredTitle}</h2>
              <p className="text-gray-500">{siteContent.featuredSubtitle}</p>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onShowStyleGuide={showStyleGuide}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 space-y-4">
              <p className="text-gray-400 text-lg">No products found.</p>
              {profile?.role === 'admin' && (
                <Link to="/admin" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-bold">
                  Go to Admin to add products
                </Link>
              )}
            </div>
          )}
        </section>

        {siteContent.aboutTitle && (
          <section className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-100">
            <div className="max-w-3xl space-y-6">
              <h2 className="text-4xl font-bold tracking-tighter">{siteContent.aboutTitle}</h2>
              <p className="text-xl text-gray-500 leading-relaxed whitespace-pre-line">
                {siteContent.aboutText}
              </p>
              {(siteContent.contactEmail || siteContent.contactPhone) && (
                <div className="pt-6 flex flex-wrap gap-8">
                  {siteContent.contactEmail && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Us</p>
                      <a href={`mailto:${siteContent.contactEmail}`} className="text-sm font-medium hover:underline">{siteContent.contactEmail}</a>
                    </div>
                  )}
                  {siteContent.contactPhone && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Call Us</p>
                      <p className="text-sm font-medium">{siteContent.contactPhone}</p>
                    </div>
                  )}
                  {siteContent.contactAddress && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visit Us</p>
                      <p className="text-sm font-medium">{siteContent.contactAddress}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="bg-black text-white py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight whitespace-pre-line">
                {siteContent.newsletterTitle} <br />
                <span className="text-gray-500">{siteContent.newsletterSubtitle}</span>
              </h2>
              <p className="text-gray-400 text-lg">
                {siteContent.newsletterDescription}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 transition-colors"
                />
                <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden hidden md:block">
              <img
                src={siteContent.heroImages[0]}
                alt="Newsletter"
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors">Shipping Info</a>
          </div>
          <p className="text-sm text-gray-400">{siteContent.footerText}</p>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />

      <Modal
        isOpen={!!styleGuide || isLoadingStyleGuide}
        onClose={() => setStyleGuide(null)}
        title={isLoadingStyleGuide ? 'Generating Style Guide...' : `Style Guide: ${styleGuide?.product.name}`}
      >
        {isLoadingStyleGuide ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-black animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Our AI stylist is curating the perfect look for you...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
              <img
                src={styleGuide?.product.image}
                alt={styleGuide?.product.name}
                className="w-20 h-20 object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold">{styleGuide?.product.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{styleGuide?.product.category}</p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                <div className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
                  {styleGuide?.content}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (styleGuide) addToCart(styleGuide.product);
                setStyleGuide(null);
              }}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading: authLoading, signIn, logout } = useFirebase();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white selection:bg-black selection:text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

import { FirebaseProvider } from './contexts/FirebaseContext';

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

