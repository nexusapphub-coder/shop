import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, CartItem, Review } from '../types';
import { useFirebase, handleFirestoreError, OperationType } from '../contexts/FirebaseContext';
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Loader2, Sparkles, Send, ChevronLeft, ChevronRight, Heart, Zap, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStyleGuide } from '../services/gemini';
import Modal from '../components/Modal';
import { cn, formatPrice } from '../utils';
import { useSiteContent } from '../hooks/useSiteContent';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signIn, profile, updateProfile } = useFirebase();
  const { content: siteContent } = useSiteContent();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [styleGuide, setStyleGuide] = useState<string | null>(null);
  const [isLoadingStyleGuide, setIsLoadingStyleGuide] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const allImages = product ? [product.image, ...(product.images || [])].filter(Boolean) : [];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);

  useEffect(() => {
    if (!id) return;
    const reviewsPath = `products/${id}/reviews`;
    const q = query(collection(db, reviewsPath), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
      setReviews(items);
    });
    return () => unsubscribe();
  }, [id]);

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

  const buyNow = async () => {
    if (!user) {
      signIn();
      return;
    }
    await addToCart();
    navigate('/checkout');
  };

  const toggleWishlist = async () => {
    if (!user || !profile || !product) {
      signIn();
      return;
    }

    const currentWishlist = profile.wishlist || [];
    const isInWishlist = currentWishlist.includes(product.id);
    
    const newWishlist = isInWishlist 
      ? currentWishlist.filter(id => id !== product.id)
      : [...currentWishlist, product.id];

    try {
      await updateProfile({ wishlist: newWishlist });
    } catch (error) {
      console.error('Failed to update wishlist:', error);
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

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !product) return;
    if (!newReview.comment.trim()) return;

    setIsSubmittingReview(true);
    const reviewsPath = `products/${id}/reviews`;
    try {
      await addDoc(collection(db, reviewsPath), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      });

      // Update product rating and review count
      const updatedReviews = [...reviews, { rating: newReview.rating } as Review];
      const totalRating = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = Number((totalRating / updatedReviews.length).toFixed(1));

      await updateDoc(doc(db, 'products', id), {
        rating: averageRating,
        reviews: updatedReviews.length
      });

      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, reviewsPath);
    } finally {
      setIsSubmittingReview(false);
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
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="aspect-square max-w-md mx-auto rounded-3xl overflow-hidden bg-gray-100 relative group shadow-2xl"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={allImages[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {allImages.map((_, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all",
                          currentImageIndex === idx ? "bg-black w-4" : "bg-black/20"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all",
                      currentImageIndex === idx ? "border-black scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold uppercase tracking-wider text-gray-500">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-base font-bold text-black">{product.rating || 0}</span>
                  <span className="text-sm text-gray-400 font-medium">({product.reviews || 0} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-mono font-black text-black">{formatPrice(product.price)}</p>
                {product.isStockOut && (
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold uppercase tracking-widest">
                    Stock Out
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Description</h3>
              <p className="text-gray-700 leading-relaxed text-base">
                {product.description || 'No description available for this premium piece.'}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={addToCart}
                  disabled={product.isStockOut}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                    product.isStockOut 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white border-2 border-black text-black hover:bg-gray-50"
                  )}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button
                  onClick={buyNow}
                  disabled={product.isStockOut}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                    product.isStockOut 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-black text-white hover:bg-gray-900 shadow-lg shadow-black/10"
                  )}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  Buy Now
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={toggleWishlist}
                    className={cn(
                      "p-4 rounded-2xl transition-all active:scale-90 border-2",
                      profile?.wishlist?.includes(product.id)
                        ? "bg-red-50 border-red-100 text-red-500"
                        : "bg-gray-50 border-transparent text-gray-400 hover:text-black"
                    )}
                    title="Add to Wishlist"
                  >
                    <Heart className={cn("w-5 h-5", profile?.wishlist?.includes(product.id) && "fill-current")} />
                  </button>
                  <button 
                    onClick={showStyleGuide}
                    className="p-4 bg-gray-100 text-black rounded-2xl hover:bg-gray-200 transition-all border-2 border-transparent"
                    title="AI Style Guide"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
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
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span>{siteContent.shippingText || 'Standard shipping available'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 space-y-12">
          <div className="flex items-center justify-between border-b border-gray-100 pb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Customer Reviews</h2>
              <p className="text-gray-500 mt-1">Share your thoughts with other customers</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-2xl font-bold">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                {product.rating || 0}
              </div>
              <p className="text-sm text-gray-400 font-medium">Based on {reviews.length} reviews</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-[2rem] p-8 space-y-6 sticky top-24">
                <h3 className="text-xl font-bold">Write a Review</h3>
                <form onSubmit={submitReview} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="p-1 transition-transform active:scale-90"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              star <= newReview.rating 
                                ? 'fill-amber-500 text-amber-500' 
                                : 'text-gray-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Your Comment</label>
                    <textarea
                      required
                      rows={4}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="What did you think about this product?"
                      className="w-full bg-white border-none rounded-2xl p-4 focus:ring-2 focus:ring-black transition-all resize-none text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !user}
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReview ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Review
                      </>
                    )}
                  </button>
                  {!user && (
                    <p className="text-[10px] text-center text-gray-400">
                      Please <button type="button" onClick={signIn} className="text-black font-bold hover:underline">sign in</button> to leave a review.
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-8">
              {reviews.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <motion.div 
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pb-8 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-base">{review.userName}</p>
                          <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.rating 
                                ? 'fill-amber-500 text-amber-500' 
                                : 'text-gray-200'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed pl-13">
                      {review.comment}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
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
