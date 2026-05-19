import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useState } from 'react';
import api from '../../services/api';

const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const currentCategory = queryParams.get('category');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const safeWishlistItems = Array.isArray(wishlistItems) ? wishlistItems.filter(p => p && p.id) : [];
  const safeCartItems = Array.isArray(cartItems) ? cartItems.filter(p => p && p.id) : [];

  const isActive = (path, category = null) => {
    if (category) {
      return location.pathname === path && currentCategory === category;
    }
    return location.pathname === path && !currentCategory;
  };

  const navLinkClass = (path, category = null) => {
    const active = isActive(path, category);
    const baseClass = "font-label-caps text-label-caps transition-colors duration-300 pb-1";
    if (active) {
      return `${baseClass} text-on-surface border-b border-on-surface`;
    }
    return `${baseClass} text-on-surface/60 hover:text-on-surface nav-underline-hover`;
  };

  return (
    <header className={`fixed top-0 w-full transition-all duration-500 border-b border-white/10 ${isMobileMenuOpen ? 'z-[200]' : 'z-40'} ${isMobileMenuOpen ? 'bg-black' : 'bg-surface/70 dark:bg-black/70 backdrop-blur-3xl'}`}>
      <nav className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-20">
        <div className="flex items-center gap-12">
          <Link to="/" className="group">
            {settings.logo_type === 'image' && settings.site_logo_url ? (
              <img src={getImageUrl(settings.site_logo_url)} alt={settings.site_name || 'Logo'} className="h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex flex-col">
                <span className="text-headline-sm font-display-lg tracking-tighter text-on-surface uppercase transition-colors duration-300 group-hover:text-primary">
                  {settings.site_name}
                </span>
                <span className="text-[7px] font-label-caps tracking-[0.4em] text-outline uppercase -mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
                  Architectural Optics
                </span>
              </div>
            )}
          </Link>
          <div className="hidden md:flex gap-8 items-center">
            <Link to="/shop" className={navLinkClass('/shop')}>Collections</Link>
            <Link to="/shop?category=optical" className={navLinkClass('/shop', 'optical')}>Optical</Link>
            <Link to="/shop?category=sunglasses" className={navLinkClass('/shop', 'sunglasses')}>Sunglasses</Link>
            <Link to="/shop?category=accessoires" className={navLinkClass('/shop', 'accessoires')}>Accessoires</Link>
            <Link to="/about" className={navLinkClass('/about')}>About</Link>
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface/60 hover:text-on-surface transition-all duration-300 group ml-2"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-500 group-hover:rotate-180">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {theme === 'dark' ? 'LIGHT' : 'DARK'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden hover:opacity-80 transition-opacity duration-300"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
          
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                {isAdmin && (
                  <Link to="/admin" className="hidden md:block font-label-caps text-[10px] text-primary">ADMIN</Link>
                )}
                <button onClick={logout} className="hover:opacity-80 transition-opacity duration-300" title="Sign Out">
                  <span className="material-symbols-outlined text-[24px]">logout</span>
                </button>
              </>
            )}
            
            {/* Wishlist Link */}
            <Link to="/profile" className={`hover:opacity-80 transition-opacity duration-300 relative ${isActive('/profile') ? 'text-primary' : ''}`} title="Wishlist">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: safeWishlistItems.length > 0 ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              {safeWishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </Link>
          </div>

          <Link to="/cart" className={`hover:opacity-80 transition-opacity duration-300 relative ${isActive('/cart') ? 'text-primary' : ''}`}>
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            {safeCartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </Link>

          {!isAuthenticated && (
            <Link to="/login" className="font-label-caps text-[11px] tracking-[0.2em] font-semibold text-on-surface/85 hover:text-primary transition-colors ml-2">
              LOGIN
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed top-20 inset-x-0 bottom-0 z-[190] bg-black animate-in fade-in slide-in-from-top-2 duration-300 overflow-y-auto"
        >
          <div className="flex flex-col p-gutter pb-20">
            <div className="bg-black border border-white/10 rounded-sm overflow-hidden flex flex-col">
              <Link 
                to="/shop" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display-lg text-headline-sm p-8 text-white uppercase border-b border-white/5 flex items-center justify-between group active:bg-white active:text-black transition-all duration-300"
              >
                <span>Collections</span>
                <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </Link>
              <Link 
                to="/shop?category=optical" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display-lg text-headline-sm p-8 text-white uppercase border-b border-white/5 flex items-center justify-between group active:bg-white active:text-black transition-all duration-300"
              >
                <span>Optical</span>
                <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </Link>
              <Link 
                to="/shop?category=sunglasses" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display-lg text-headline-sm p-8 text-white uppercase border-b border-white/5 flex items-center justify-between group active:bg-white active:text-black transition-all duration-300"
              >
                <span>Sunglasses</span>
                <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </Link>
              <Link 
                to="/shop?category=accessoires" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display-lg text-headline-sm p-8 text-white uppercase border-b border-white/5 flex items-center justify-between group active:bg-white active:text-black transition-all duration-300"
              >
                <span>Accessoires</span>
                <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </Link>
              <Link 
                to="/about" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display-lg text-headline-sm p-8 text-white uppercase border-b border-white/5 flex items-center justify-between group active:bg-white active:text-black transition-all duration-300"
              >
                <span>About</span>
                <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </Link>
              
              <button 
                onClick={() => {
                  toggleTheme();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-between p-8 text-white font-display-lg text-headline-sm border-b border-white/5 uppercase active:bg-white active:text-black transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[28px]">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <span className="material-symbols-outlined opacity-40">sync</span>
              </button>

              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="font-display-lg text-headline-sm p-8 text-primary uppercase flex items-center justify-between active:bg-primary active:text-black transition-all duration-300"
                >
                  <span>Admin Panel</span>
                  <span className="material-symbols-outlined opacity-40">dashboard</span>
                </Link>
              )}
            </div>
            
            <p className="font-label-caps text-[9px] text-on-surface/30 mt-8 text-center tracking-[0.3em] uppercase">
              {settings.site_name} — Architectural Optics
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
