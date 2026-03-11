import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase, OperationType, handleFirestoreError } from '../contexts/FirebaseContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { CartItem, Order } from '../types';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

export default function CheckoutPage() {
  const { user, signIn, profile, loading: authLoading } = useFirebase();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      signIn();
      return;
    }

    const cartPath = `users/${user.uid}/cart`;
    const unsubscribe = onSnapshot(collection(db, cartPath), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as CartItem);
      setCartItems(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, cartPath);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handlePlaceOrder = async (orderData: Omit<Order, 'userId' | 'status' | 'createdAt'>, status: Order['status'] = 'pending') => {
    if (!user) return;
    
    const newOrder: Order = {
      ...orderData,
      userId: user.uid,
      status: status,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'orders', orderData.id), newOrder);
      
      // Save delivery info to user profile
      await updateDoc(doc(db, 'users', user.uid), {
        deliveryInfo: orderData.customerInfo
      });
      
      // Clear cart
      const batch = writeBatch(db);
      cartItems.forEach(item => {
        batch.delete(doc(db, `users/${user.uid}/cart`, item.id));
      });
      await batch.commit();
      
      navigate('/orders');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-gray-500">Add some items to your cart to proceed to checkout.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors"
        >
          Back to Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wider text-xs">Back</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-black text-white">
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
            <p className="text-gray-400 text-sm mt-1">Complete your order details below</p>
          </div>

          <div className="p-8">
            <CheckoutModal
              isOpen={true}
              onClose={() => navigate(-1)}
              items={cartItems}
              total={cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
              onSubmit={handlePlaceOrder}
              isStandalone={true}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          <p className="text-xs font-medium uppercase tracking-widest">Secure Checkout Powered by Firebase</p>
        </div>
      </div>
    </div>
  );
}
