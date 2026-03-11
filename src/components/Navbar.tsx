import React from 'react';
import { ShoppingCart, Search, User, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile } from '../types';
import { Link } from 'react-router-dom';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  user: FirebaseUser | null;
  profile: UserProfile | null;
  onSignIn: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export default function Navbar({ 
  cartCount, 
  onCartClick, 
  user, 
  profile, 
  onSignIn, 
  onLogout,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4',
        isScrolled || isSearchOpen ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-black">
            VIBESHOP
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  "hover:text-black transition-colors",
                  selectedCategory === cat ? "text-black font-bold" : ""
                )}
              >
                {cat === 'All' ? 'Shop All' : cat}
              </button>
            ))}
            <a 
              href="https://nexus-appshub.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              Apps
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex items-center">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products..."
                  className="bg-black/5 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                  autoFocus
                />
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : onSignIn()}
              className="p-2 hover:bg-black/5 rounded-full transition-colors overflow-hidden"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            <AnimatePresence>
              {isUserMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[100]"
                >
                  <div className="px-4 py-3 border-b border-gray-50 mb-2">
                    <p className="text-sm font-bold truncate">{user.displayName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onCartClick}
            className="p-2 hover:bg-black/5 rounded-full transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button
            className="md:hidden p-2 hover:bg-black/5 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-4 text-lg font-medium">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    onCategoryChange(cat);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "text-left hover:text-gray-600 transition-colors",
                    selectedCategory === cat ? "text-black font-bold" : "text-gray-500"
                  )}
                >
                  {cat === 'All' ? 'Shop All' : cat}
                </button>
              ))}
              <a 
                href="https://nexus-appshub.netlify.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-left text-gray-500 hover:text-gray-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Apps
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
