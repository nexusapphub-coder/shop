import React, { useState, useEffect } from 'react';
import { useFirebase, OperationType, handleFirestoreError } from '../contexts/FirebaseContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Phone, MapPin, Save, Loader2, ArrowLeft, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useFirebase();
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
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
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
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        deliveryInfo: { 
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
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <UserCircle className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Sign in to view profile</h1>
            <p className="text-gray-500">Please log in to manage your delivery details and account settings.</p>
          </div>
          <Link to="/" className="block w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-gray-500">Manage your default delivery information for faster checkout.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black text-white text-2xl font-bold">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.displayName}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {profile?.role === 'admin' ? 'Administrator' : 'Customer'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Default Delivery Details</h3>
            
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Full Name</label>
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
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Phone Number</label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Division / বিভাগ</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Division"
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Zilla / জেলা</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Zilla"
                      value={zilla}
                      onChange={(e) => setZilla(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Upozilla / উপজেলা</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Upozilla"
                      value={upozilla}
                      onChange={(e) => setUpozilla(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Thana / City Corp</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Thana"
                      value={thana}
                      onChange={(e) => setThana(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Ward No. / ওয়ার্ড নং</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Ward No."
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Postal Code / ডাকঘর</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Specific Area / এলাকা</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="Specific Area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">House / Road No. / বাড়ি ও রাস্তা নং</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="House / Road No."
                    value={houseRoad}
                    onChange={(e) => setHouseRoad(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition-all"
                  />
                </div>
              </div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl text-sm font-medium ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
