import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { SiteContent } from '../types';

const DEFAULT_CONTENT: SiteContent = {
  heroTitle: 'CRAFTED FOR THE MODERN VIBE',
  heroSubtitle: 'Discover our curated collection of premium essentials designed for your daily life.',
  heroImages: [
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1920',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920',
    'https://images.unsplash.com/photo-1441986236893-39027735e38b?auto=format&fit=crop&q=80&w=1920'
  ],
  featuredTitle: 'Featured Products',
  featuredSubtitle: 'Carefully selected pieces for your collection.',
  newsletterTitle: 'JOIN THE VIBE',
  newsletterSubtitle: 'GET 15% OFF YOUR FIRST ORDER',
  newsletterDescription: 'Be the first to know about new drops, exclusive collections, and seasonal sales.',
  footerText: '© 2026 VIBESHOP. All rights reserved.',
  aboutTitle: 'Our Story',
  aboutText: 'VIBESHOP started with a simple idea: to bring the best of modern design to everyone. We believe that the objects you surround yourself with should be as beautiful as they are functional.',
  contactEmail: 'hello@vibeshop.com',
  contactPhone: '+1 (555) 000-0000',
  contactAddress: '123 Vibe Street, Design District, NY 10001',
  banners: [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920',
      title: 'Summer Collection',
      subtitle: 'Up to 50% off',
      link: '/category/Cloths'
    }
  ]
};

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'site_content');
    const unsubscribe = onSnapshot(docRef, (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        setContent(snapshot.data() as SiteContent);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to site content:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateContent = async (newContent: SiteContent) => {
    await setDoc(doc(db, 'settings', 'site_content'), newContent);
  };

  return { content, updateContent, loading };
}
