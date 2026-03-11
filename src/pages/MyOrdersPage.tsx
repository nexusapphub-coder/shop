import React, { useState, useEffect } from 'react';
import { useFirebase, OperationType, handleFirestoreError } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { formatPrice } from '../utils';
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useFirebase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ordersPath = 'orders';
    const q = query(
      collection(db, ordersPath),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setOrders(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, ordersPath);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Sign in to track orders</h1>
            <p className="text-gray-500">Please log in to view your order history and tracking information.</p>
          </div>
          <Link to="/" className="block w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-gray-500">Track your orders and view your purchase history.</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-6 border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">No orders yet</h2>
              <p className="text-gray-500">When you place an order, it will appear here.</p>
            </div>
            <Link to="/" className="inline-block bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={order.id}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Order ID</p>
                    <p className="font-mono font-bold text-sm">{order.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Delivery Details</h3>
                      <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-sm">
                        <p className="font-bold">{order.customerInfo.name}</p>
                        <p className="text-gray-600">{order.customerInfo.phone}</p>
                        <div className="text-gray-600 space-y-1 pt-1">
                          <p>{order.customerInfo.houseRoad}, {order.customerInfo.area}</p>
                          <p>Ward {order.customerInfo.ward}, {order.customerInfo.thana}</p>
                          <p>{order.customerInfo.upozilla}, {order.customerInfo.zilla}</p>
                          <p>{order.customerInfo.division} - {order.customerInfo.postalCode}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Summary</h3>
                      <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Date</span>
                          <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Payment Method</span>
                          <span className="font-medium">{order.paymentMethod}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="font-bold">Total</span>
                          <span className="text-lg font-bold">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.status !== 'cancelled' && (
                    <div className="pt-6 border-t border-gray-50">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Tracking Progress</h3>
                      <div className="relative flex justify-between">
                        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-100 -z-0" />
                        {[
                          { label: 'Pending', status: 'pending' },
                          { label: 'Confirmed', status: 'confirmed' },
                          { label: 'Shipped', status: 'shipped' },
                          { label: 'Delivered', status: 'delivered' }
                        ].map((step, idx) => {
                          const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
                          const currentIdx = statuses.indexOf(order.status);
                          const stepIdx = statuses.indexOf(step.status);
                          const isCompleted = stepIdx <= currentIdx;
                          const isActive = stepIdx === currentIdx;

                          return (
                            <div key={step.status} className="relative flex flex-col items-center gap-2 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                                isCompleted ? 'bg-black border-black text-white' : 'bg-white border-gray-100 text-gray-300'
                              } ${isActive ? 'ring-4 ring-black/10' : ''} transition-all`}>
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted ? 'text-black' : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
