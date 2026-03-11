import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteContent } from '../hooks/useSiteContent';

export default function Hero() {
  const { content } = useSiteContent();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (content.heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % content.heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [content.heroImages.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % content.heroImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + content.heroImages.length) % content.heroImages.length);
  };

  return (
    <section className="relative min-h-[80vh] py-20 flex items-center justify-center overflow-hidden bg-black">
      {/* Background Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img
            src={content.heroImages[currentImageIndex]}
            alt="Hero Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </AnimatePresence>

      {/* Slider Controls */}
      {content.heroImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {content.heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-6 relative z-20 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-sm font-medium text-white"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          New Collection 2026
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-white whitespace-pre-line"
        >
          {content.heroTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-white/80 font-medium"
        >
          {content.heroSubtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <button 
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-white/10"
          >
            Shop Collection
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => document.getElementById('lookbook')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all active:scale-95"
          >
            View Lookbook
          </button>
        </motion.div>
      </div>
    </section>
  );
}
