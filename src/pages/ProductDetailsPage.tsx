import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, CartItem } from '../types';
import { useFirebase, handleFirestoreError, OperationType } from '../contexts/FirebaseContext';
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { getStyleGuide } from '../services/gemini';
import Modal from '../components/Modal';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signIn } = useFirebase();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [styleGuide, setStyleGuide] = useState<string | null>(null);
  const [isLoadingStyleGuide, setIsLoadingStyleGuide] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ ...docSnap.data(), id: docSnap.id } as Product);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (!user) return;
    const cartPath = `users/${user.uid}/cart`;
    const unsubscribe = onSnapshot(collection(db, cartPath), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as CartItem);
      setCartItems(items);
    });
    return () => unsubscribe();
  }, [user]);

  const addToCart = async () => {
    if (!user) {
      signIn();
      return;
    }
    if (!product) return;

    const cartPath = `users/${user.uid}/cart`;
    try {
      const existing = cartItems.find((item) => item.id === product.id);
      if (existing) {
        await updateDoc(doc(db, cartPath, product.id), {
          quantity: existing.quantity + 1
        });
      } else {
        const newItem: CartItem = {
          ...product,
          quantity: 1
        };
        await setDoc(doc(db, cartPath, product.id), newItem);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, cartPath);
    }
  };

  const showStyleGuide = async () => {
    if (!product) return;
    setIsLoadingStyleGuide(true);
    setIsModalOpen(true);
    try {
      const content = await getStyleGuide(product.name, product.category);
      setStyleGuide(content);
    } catch (error) {
      console.error('Failed to get style guide:', error);
    } finally {
      setIsLoadingStyleGuide(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Collection
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase tracking-wider text-gray-500">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold text-black">{product.rating || 0}</span>
                  <span className="text-xs text-gray-400 font-medium">({product.reviews || 0} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-2xl font-mono font-medium">${product.price.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'No description available for this premium piece.'}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <button
                  onClick={addToCart}
                  className="flex-1 bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all active:scale-[0.98]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button 
                  onClick={showStyleGuide}
                  className="p-4 bg-gray-100 text-black rounded-2xl hover:bg-gray-200 transition-all"
                  title="AI Style Guide"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <p className="text-xs text-gray-500 font-medium">
                  Authentic product with secure checkout and easy returns.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-100">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Availability</p>
                <p className="text-sm font-medium">{product.stock && product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Shipping</p>
                <p className="text-sm font-medium">Free worldwide shipping</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isLoadingStyleGuide ? 'Generating Style Guide...' : `Style Guide: ${product.name}`}
      >
        {isLoadingStyleGuide ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-black animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Our AI stylist is curating the perfect look for you...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
              <div className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
                {styleGuide}
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-colors"
            >
              Got it
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
