import React, { useState, useEffect } from 'react';
import { X, CreditCard, Phone, MapPin, User, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, CartItem, Order, PaymentSettings } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFirebase } from '../contexts/FirebaseContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onSubmit: (orderData: Omit<Order, 'userId' | 'status' | 'createdAt'>) => Promise<void>;
}

export default function CheckoutModal({ isOpen, onClose, items, total, onSubmit }: CheckoutModalProps) {
  const { profile } = useFirebase();
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('');
  const [zilla, setZilla] = useState('');
  const [upozilla, setUpozilla] = useState('');
  const [thana, setThana] = useState('');
  const [ward, setWard] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [area, setArea] = useState('');
  const [houseRoad, setHouseRoad] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Cash on Delivery'>('Cash on Delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [orderId, setOrderId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (profile?.deliveryInfo) {
        setName(profile.deliveryInfo.name || '');
        setPhone(profile.deliveryInfo.phone || '');
        setDivision(profile.deliveryInfo.division || '');
        setZilla(profile.deliveryInfo.zilla || '');
        setUpozilla(profile.deliveryInfo.upozilla || '');
        setThana(profile.deliveryInfo.thana || '');
        setWard(profile.deliveryInfo.ward || '');
        setPostalCode(profile.deliveryInfo.postalCode || '');
        setArea(profile.deliveryInfo.area || '');
        setHouseRoad(profile.deliveryInfo.houseRoad || '');
      } else if (profile) {
        setName(profile.displayName || '');
      }
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (isOpen && !orderId) {
      setOrderId(`ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      const docRef = doc(db, 'settings', 'payment');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPaymentSettings(docSnap.data() as PaymentSettings);
      }
    };
    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'info') {
      setStep('payment');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: orderId,
        items,
        total,
        paymentMethod,
        customerInfo: { 
          name, 
          phone, 
          division,
          zilla,
          upozilla,
          thana,
          ward,
          postalCode,
          area,
          houseRoad
        }
      });
      setStep('success');
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPaymentApp = (method: 'bKash' | 'Nagad') => {
    const urls = {
      bKash: 'https://www.bkash.com/app/',
      Nagad: 'https://www.nagad.com.bd/app/'
    };
    window.open(urls[method], '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative p-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {step === 'success' ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Order Placed!</h2>
                <p className="text-gray-500">Your order has been sent to our team for review. We will contact you shortly.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={onClose}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-[0.98]"
                >
                  Continue Shopping
                </button>
                <Link
                  to="/orders"
                  onClick={onClose}
                  className="block w-full text-center py-2 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                >
                  Track My Order
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Checkout</h2>
                <p className="text-gray-500">
                  {step === 'info' ? 'Please provide your delivery details' : 'Choose your preferred payment method'}
                </p>
              </div>

              {step === 'info' ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Division / বিভাগ"
                        value={division}
                        onChange={(e) => setDivision(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Zilla / জেলা"
                        value={zilla}
                        onChange={(e) => setZilla(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Upozilla / উপজেলা"
                        value={upozilla}
                        onChange={(e) => setUpozilla(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Thana / City Corp"
                        value={thana}
                        onChange={(e) => setThana(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Ward No. / ওয়ার্ড নং"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="text"
                        placeholder="Postal Code / ডাকঘর"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Specific Area / এলাকা"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="House / Road No. / বাড়ি ও রাস্তা নং"
                      value={houseRoad}
                      onChange={(e) => setHouseRoad(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {paymentMethod !== 'Cash on Delivery' && (
                    <div className="p-6 bg-gray-50 rounded-3xl space-y-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Order Reference ID</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderId)}
                          className="text-xs font-bold text-black flex items-center gap-1 hover:opacity-70 transition-opacity"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3" />
                              Copy ID
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono font-bold text-center text-lg tracking-wider bg-white py-3 rounded-xl border border-gray-100">
                        {orderId}
                      </p>
                      <p className="text-[10px] text-center text-gray-500">
                        Please use this Order ID as the <span className="font-bold text-black">Reference</span> when making the payment.
                      </p>
                      <button
                        type="button"
                        onClick={() => openPaymentApp(paymentMethod as 'bKash' | 'Nagad')}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        Open {paymentMethod} App
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {[
                      { id: 'Cash on Delivery', icon: CreditCard, label: 'Cash on Delivery' },
                      { id: 'bKash', icon: Phone, label: 'bKash', number: paymentSettings?.bkashNumber },
                      { id: 'Nagad', icon: Phone, label: 'Nagad', number: paymentSettings?.nagadNumber }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                          paymentMethod === method.id 
                            ? 'border-black bg-black text-white' 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <method.icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-white' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <p className="font-bold">{method.label}</p>
                            {method.number && (
                              <p className={`text-xs ${paymentMethod === method.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                Send money to: {method.number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id ? 'border-white' : 'border-gray-200'
                        }`}>
                          {paymentMethod === method.id && <div className="w-3 h-3 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    step === 'info' ? 'Next: Payment Method' : 'Confirm Order'
                  )}
                </button>
                {step === 'payment' && (
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="w-full py-2 text-gray-500 font-medium hover:text-black transition-colors"
                  >
                    Back to delivery info
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
