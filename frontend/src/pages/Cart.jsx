import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAlert } from '../context/AlertContext';
import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import api from '../services/api';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, subtotal } = useCart();
  const { showConfirm, showAlert } = useAlert();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Dynamically resolve backend host for images
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');
  const resolveImage = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
  };

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        const response = await api.get('/products?limit=4');
        console.log("Recently viewed items fetched:", response.data.products);
        setRecentlyViewed(response.data.products || []);
      } catch (err) {
        console.error("Error fetching recently viewed:", err);
      }
    };
    fetchRecentlyViewed();
  }, []);

  console.log("Rendering Cart. Items:", cartItems);

  return (
    <main className="pt-32 pb-24 px-gutter max-w-container-max mx-auto min-h-screen">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-12 font-label-caps text-label-caps text-on-surface-variant">
        <Link className="hover:text-on-surface transition-colors" to="/">Home</Link>
        <span>/</span>
        <span className="text-on-surface">Your Cart</span>
      </nav>

      <header className="mb-16">
        <h1 className="font-display-lg text-[40px] md:text-[72px] mb-4 uppercase">Cart</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Review your selection of architectural optics and handcrafted accessories.
        </p>
      </header>

      {cartItems.length === 0 ? (
        <div className="text-center py-24 glass-card border border-white/10">
          <p className="font-body-lg text-on-surface-variant mb-8 uppercase tracking-widest">Your bag is currently empty.</p>
          <Link 
            to="/shop" 
            className="inline-block px-12 py-5 bg-white text-black font-label-caps text-label-caps hover:opacity-80 transition-all uppercase tracking-widest"
          >
            Explore Collections
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            {cartItems.map((item) => {
              const colorObj = Array.isArray(item.colors)
                ? item.colors.find(c => {
                    const cName = typeof c === 'string' ? c : (c.name || c.hex || '');
                    return cName === item.selectedColor;
                  })
                : null;
              const resolvedItemImage = colorObj?.image_url || item.image_url;

              return (
                <div key={item.cartItemId || item.id} className="flex flex-col md:flex-row gap-6 md:gap-8 pb-8 md:pb-12 border-b border-white/10 group">
                  <Link to={`/product/${item.id}`} className="w-full md:w-48 aspect-[4/3] md:aspect-square overflow-hidden bg-surface-container-low relative block">
                    <img 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-screen" 
                      src={resolveImage(resolvedItemImage)} 
                    />
                    {/* Mobile-only category tag */}
                    <div className="absolute top-4 left-4 md:hidden">
                      <span className="bg-black/50 backdrop-blur-md px-3 py-1 font-label-caps text-[8px] tracking-[0.2em] text-white/80 border border-white/10 uppercase">
                        {item.category_name || 'COLLECTION'}
                      </span>
                    </div>
                  </Link>
                  
                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-display-lg text-[20px] md:text-headline-sm text-on-surface mb-2 uppercase tracking-tight line-clamp-1 hover:text-primary transition-colors">{item.name}</h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-label-caps text-[10px] tracking-widest text-on-surface-variant/60 uppercase">
                          <span>{item.category_name || 'COLLECTION'}</span>
                          {item.selectedColor && (
                            <>
                              <span className="opacity-30">•</span>
                              <div className="flex items-center gap-1.5 text-primary">
                                {colorObj?.hex && (
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block" 
                                    style={{ backgroundColor: colorObj.hex }}
                                  ></span>
                                )}
                                <span>{item.selectedColor}</span>
                              </div>
                            </>
                          )}
                          {item.selectedSize && (
                            <>
                              <span className="opacity-30">•</span>
                              <span>{item.selectedSize}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="font-display-lg text-headline-sm md:text-body-lg text-primary">{formatCurrency(item.price, currency)}</span>
                    </div>

                  <div className="flex items-center justify-between mt-8 md:mt-0">
                    <div className="flex items-center bg-surface-container-low border border-white/10 h-12 md:h-10 px-2 rounded-sm shadow-inner">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId || item.id, (item.quantity || 1) - 1)}
                        className="w-10 h-full flex items-center justify-center hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">remove</span>
                      </button>
                      <span className="w-10 text-center font-display-lg text-body-md border-x border-white/5 mx-1">{item.quantity || 1}</span>
                      <button 
                        onClick={() => updateQuantity(item.cartItemId || item.id, (item.quantity || 1) + 1)}
                        className="w-10 h-full flex items-center justify-center hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>

                    <button 
                      onClick={async () => {
                        const confirmed = await showConfirm({
                          title: 'Remove Item?',
                          message: `Remove ${item.name} from your bag?`,
                          confirmText: 'Remove',
                          cancelText: 'Keep'
                        });
                        if (confirmed) {
                          removeFromCart(item.cartItemId || item.id);
                        }
                      }}
                      className="flex items-center gap-2 p-2 text-on-surface-variant/40 hover:text-error transition-all active:scale-90"
                      title="Remove Item"
                    >
                      <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                      <span className="hidden sm:inline font-label-caps text-[10px] tracking-widest uppercase">Remove</span>
                    </button>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-4 sticky top-32 space-y-8">
            <div className="p-8 bg-surface-container border border-white/10">
              <h2 className="font-headline-sm text-headline-sm mb-8 uppercase">Order Summary</h2>
              <div className="space-y-4 font-body-md text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-on-surface">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="text-on-surface">Calculated at next step</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span className="text-on-surface">{formatCurrency(0, currency)}</span>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Total</span>
                <span className="font-headline-md text-headline-md">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="mt-12 space-y-4">
                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full h-14 bg-white text-on-primary font-label-caps text-label-caps uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  Proceed to Checkout
                </button>
                <p className="text-center font-label-caps text-[10px] text-on-surface/40 uppercase tracking-widest">Secured checkout powered by STRIPE</p>
              </div>
            </div>

            {/* Promo Code */}
            <div className="p-8 border border-white/10">
              <p className="font-label-caps text-label-caps mb-4 uppercase">Promo Code</p>
              <div className="flex">
                <input 
                  className="flex-grow bg-transparent border-b border-white/20 focus:border-white focus:ring-0 text-on-surface transition-colors placeholder:text-on-surface/20 outline-none pb-2" 
                  placeholder="Enter code" 
                  type="text"
                />
                <button className="px-6 font-label-caps text-label-caps hover:text-primary transition-colors uppercase">Apply</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="mt-24 md:mt-40">
          <div className="flex justify-between items-end mb-8 md:mb-12">
            <div>
              <p className="font-label-caps text-label-caps text-primary mb-2 md:mb-4">CONTINUE EXPLORING</p>
              <h2 className="font-display-lg text-headline-sm md:font-headline-md md:text-headline-md uppercase">Recently Viewed</h2>
            </div>
            <Link to="/shop" className="font-label-caps text-[10px] md:text-label-caps border-b border-on-surface/20 hover:border-on-surface transition-colors pb-1 uppercase">View All</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {recentlyViewed.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="glass-card p-4 md:p-6 transition-all duration-500 hover:-translate-y-2 group flex flex-col">
                <div className="aspect-square bg-white/5 mb-4 md:mb-8 overflow-hidden relative">
                  <img 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 mix-blend-screen" 
                    src={resolveImage(product.image_url)} 
                  />
                </div>
                <div className="flex-grow">
                  <p className="font-label-caps text-[8px] md:text-label-caps text-on-surface-variant mb-1 md:mb-2 uppercase tracking-widest">{product.category_name || 'COLLECTION'}</p>
                  <h4 className="font-display-lg text-[14px] md:text-[18px] mb-2 uppercase line-clamp-1">{product.name}</h4>
                </div>
                <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="font-body-md text-[12px] md:text-body-md text-on-surface/60">{formatCurrency(product.price, currency)}</span>
                  <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity text-primary">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default Cart;
