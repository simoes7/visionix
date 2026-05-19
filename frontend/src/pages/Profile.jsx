import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Dynamically resolve backend host for images
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');
  const resolveImage = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
  };

  // Fetch recently viewed items from localStorage with validation
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      setRecentlyViewed(Array.isArray(recent) ? recent.filter(p => p && p.id) : []);
    } catch (e) {
      console.error('Failed to load recently viewed:', e);
    }
  }, []);

  // Safe sanitized arrays to prevent any runtime TypeErrors
  const safeWishlistItems = Array.isArray(wishlistItems) ? wishlistItems.filter(p => p && p.id) : [];
  const safeRecentlyViewed = Array.isArray(recentlyViewed) ? recentlyViewed.filter(p => p && p.id) : [];

  return (
    <main className="pt-36 pb-24 px-gutter max-w-container-max mx-auto">
      {/* Header */}
      <header className="border-b border-white/5 pb-8 mb-12">
        <p className="font-label-caps text-label-caps text-primary tracking-widest mb-3 uppercase">YOUR CURATED SELECTION</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-[40px] md:text-[64px] text-on-surface uppercase leading-none tracking-tight">
              Wishlist
            </h1>
            <p className="text-on-surface-variant/70 font-body-md mt-2">Explore, compare, and try on your favorite design silhouettes.</p>
          </div>
          <div className="bg-surface-container-low border border-white/5 px-6 py-3 rounded-full flex items-center gap-3 w-max">
            <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <span className="font-label-caps text-label-caps text-on-surface text-[11px] tracking-wider uppercase font-semibold">
              {safeWishlistItems.length} {safeWishlistItems.length === 1 ? 'Item' : 'Items'} Saved
            </span>
          </div>
        </div>
      </header>

      {/* Main Wishlist Grid */}
      <section className="mb-20">
        {safeWishlistItems.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl bg-surface-container-low/20 backdrop-blur-md max-w-2xl mx-auto px-6">
            <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">favorite_border</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface mb-2">Your collection is empty</h3>
            <p className="text-on-surface-variant/70 font-body-md mb-8 max-w-md mx-auto">
              Save your favorite optical and sunglasses silhouettes while browsing to see them here and try them on virtually.
            </p>
            <Link to="/shop" className="inline-block bg-on-surface text-background px-10 py-4 font-label-caps text-label-caps hover:bg-on-surface/90 transition-colors uppercase tracking-widest text-[11px] font-bold rounded-lg">
              Explore Collections
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {safeWishlistItems.map((product) => (
              <div key={product.id} className="product-card group relative flex flex-col justify-between">
                <div className="relative aspect-[3/4] bg-surface-container-lowest overflow-hidden mb-6 hairline-border rounded-xl">
                  <Link to={`/product/${product.id}`} className="block w-full h-full">
                    <img 
                      className="w-full h-full object-cover grayscale brightness-90 transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-100" 
                      src={resolveImage(product.image_url)} 
                      alt={product.name} 
                    />
                  </Link>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-4 right-4 z-10 p-2 bg-background/50 hover:bg-background/80 backdrop-blur-md rounded-full shadow-lg transition-colors group/btn"
                    title="Remove from wishlist"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary group-hover/btn:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex flex-col gap-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto px-4">
                    <button 
                      onClick={() => addToCart(product)} 
                      className="w-full bg-white text-black py-3 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all font-bold rounded-lg shadow-lg"
                    >
                      Add to Bag
                    </button>
                    {product.category_name && (product.category_name.toLowerCase().includes('sunglasses') || product.category_name.toLowerCase().includes('optical')) && (
                      <Link 
                        to={`/try-on/${product.id}`} 
                        className="w-full bg-white/10 backdrop-blur-md text-white border border-white/30 py-3 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all text-center font-bold rounded-lg"
                      >
                        Virtual Try-On
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-start px-2">
                  <div>
                    <h3 className="font-label-caps text-label-caps uppercase tracking-widest text-[13px] text-on-surface group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="font-body-md text-on-surface-variant/60 text-[11px] uppercase tracking-wide mt-0.5">{product.frame_style}</p>
                  </div>
                  <p className="font-label-caps text-on-surface text-[14px] font-semibold">{formatCurrency(product.price, currency)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Viewed Section */}
      {safeRecentlyViewed.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-white/5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-sm text-headline-sm uppercase text-on-surface">Recently Viewed</h2>
            <Link to="/shop" className="font-label-caps text-[11px] text-primary hover:underline uppercase tracking-widest">Shop All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {safeRecentlyViewed.map((item) => (
              <Link key={item.id} to={`/product/${item.id}`} className="space-y-3 group block cursor-pointer">
                <div className="aspect-[3/4] bg-surface-container-highest overflow-hidden hairline-border rounded-xl">
                  <img 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src={resolveImage(item.image_url)} 
                  />
                </div>
                <div>
                  <p className="font-label-caps text-[9px] text-on-surface-variant/70 uppercase tracking-widest">{item.category_name || 'COLLECTION'}</p>
                  <h4 className="font-label-caps text-label-caps uppercase tracking-widest text-[12px] text-on-surface group-hover:text-primary transition-colors truncate">{item.name}</h4>
                  <p className="font-body-md text-on-surface-variant/80 text-[11px] mt-0.5">{formatCurrency(item.price, currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default Profile;
