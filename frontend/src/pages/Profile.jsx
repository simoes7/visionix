import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import api from '../services/api';
import Loading from '../components/common/Loading';

const Profile = () => {
  const { user, logout } = useAuth();
  const { addToCart } = useCart();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Dynamically resolve backend host for images
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');
  const resolveImage = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
  };
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveTab] = useState(tabParam || 'profile');

  // Sync active section when tab param changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(response.data || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading) return <Loading />;

  const latestOrder = orders.length > 0 ? orders[0] : null;

  const navLinks = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'history', label: 'Order History', icon: 'history' },
    { id: 'addresses', label: 'Saved Addresses', icon: 'location_on' },
    { id: 'wishlist', label: 'Wishlist', icon: 'favorite' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ];

  return (
    <main className="pt-32 pb-24 px-gutter max-w-container-max mx-auto">
      {/* Mobile Tab Navigation */}
      <div className="md:hidden overflow-x-auto hide-scrollbar -mx-gutter px-gutter mb-12 border-b border-white/5 sticky top-20 bg-background z-30">
        <div className="flex gap-8 py-4 w-max">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex items-center gap-2 transition-all duration-300 whitespace-nowrap ${
                activeSection === link.id 
                  ? 'text-primary' 
                  : 'text-on-surface/40'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              <span className="font-label-caps text-[10px] tracking-widest uppercase">{link.label}</span>
              {activeSection === link.id && (
                <div className="h-1 w-1 bg-primary rounded-full ml-1 animate-in zoom-in duration-300"></div>
              )}
            </button>
          ))}
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-error/60 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="font-label-caps text-[10px] tracking-widest uppercase">Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2">
          <div className="sticky top-32 space-y-8">
            <div className="space-y-4">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant opacity-50 uppercase tracking-widest text-[10px]">Account</h3>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`flex items-center gap-3 py-2 transition-all duration-300 group ${
                      activeSection === link.id 
                        ? 'text-on-surface border-b border-on-surface pb-1' 
                        : 'text-on-surface/60 hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                    <span className="font-label-caps text-label-caps">{link.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="pt-8 border-t border-white/5">
              <button 
                onClick={logout}
                className="font-label-caps text-label-caps text-error/80 hover:text-error transition-colors uppercase tracking-widest text-[12px]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="md:col-span-9 lg:col-span-10 space-y-16">
          
          {/* Profile Overview Section */}
          {activeSection === 'profile' && (
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="font-label-caps text-label-caps text-primary tracking-widest mb-2 uppercase">WELCOME BACK</p>
                  <h1 className="font-display-lg text-[48px] md:text-[80px] text-on-surface uppercase leading-none tracking-tighter">{user?.name}</h1>
                  </div>                <div className="bg-surface-container-low hairline-border p-6 rounded-lg shadow-[0px_20px_40px_rgba(0,0,0,0.05)] flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-label-caps text-label-caps text-on-surface-variant opacity-60 uppercase text-[10px]">BESPOKE CREDITS</p>
                    <p className="font-display-lg text-headline-sm text-tertiary">2,450 <span className="text-label-caps font-label-caps lowercase">vX</span></p>
                  </div>
                  <div className="h-12 w-px bg-white/10"></div>
                  <button className="bg-on-surface text-background px-6 py-3 font-label-caps text-label-caps hover:opacity-80 transition-opacity uppercase tracking-widest">REDEEM</button>
                </div>
              </div>

              {/* Latest Order Tracker */}
              {latestOrder && (
                <div className="bg-surface-container hairline-border p-8 rounded-lg shadow-[0px_20px_40px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm uppercase">Latest Order</h3>
                      <p className="text-on-surface-variant text-body-md">#VX-{latestOrder.id} — Ordered {new Date(latestOrder.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <span className="bg-primary-container text-primary px-4 py-1 rounded-full font-label-caps text-[10px] tracking-widest uppercase">
                      {latestOrder.status === 'pending' ? 'In Production' : latestOrder.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="relative pt-4">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 w-2/3 h-[1px] bg-primary -translate-y-1/2"></div>
                    <div className="relative flex justify-between">
                      {['CONFIRMED', 'CRAFTING', 'QUALITY CHECK', 'SHIPPED'].map((step, idx) => (
                        <div key={step} className={`flex flex-col items-center gap-3 ${idx > 2 ? 'opacity-30' : ''}`}>
                          <div className={`w-3 h-3 rounded-full ${idx > 2 ? 'bg-surface-container-highest' : 'bg-primary ring-4 ring-primary/20'}`}></div>
                          <span className="font-label-caps text-[10px] text-on-surface uppercase">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Order History Section */}
          {(activeSection === 'profile' || activeSection === 'history') && (
            <section className="space-y-6">
              <h2 className="font-headline-sm text-headline-sm uppercase">Order History</h2>
              <div className="overflow-x-auto">
                {orders.length === 0 ? (
                  <p className="text-on-surface-variant font-body-md py-8">No orders found.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-4 font-label-caps text-label-caps text-on-surface-variant text-[10px] tracking-widest uppercase">ORDER ID</th>
                        <th className="py-4 font-label-caps text-label-caps text-on-surface-variant text-[10px] tracking-widest uppercase">DATE</th>
                        <th className="py-4 font-label-caps text-label-caps text-on-surface-variant text-[10px] tracking-widest uppercase">STATUS</th>
                        <th className="py-4 font-label-caps text-label-caps text-on-surface-variant text-[10px] tracking-widest uppercase">TOTAL</th>
                        <th className="py-4 font-label-caps text-label-caps text-on-surface-variant text-right text-[10px] tracking-widest uppercase">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-6 font-body-md">#VX-{order.id}</td>
                          <td className="py-6 font-body-md">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                          <td className="py-6"><span className="text-on-surface-variant/70 font-label-caps text-[10px] uppercase">{order.status}</span></td>
                          <td className="py-6 font-body-md">{formatCurrency(order.total_amount, currency)}</td>
                          <td className="py-6 text-right">
                            <button className="font-label-caps text-label-caps underline decoration-1 underline-offset-4 hover:text-primary transition-colors text-[10px] tracking-widest uppercase">INVOICE</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* Saved Addresses Section */}
          {(activeSection === 'profile' || activeSection === 'addresses') && (
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-sm text-headline-sm uppercase">Saved Addresses</h2>
                <button className="font-label-caps text-label-caps border border-white/20 px-4 py-2 hover:bg-white/5 transition-colors uppercase text-[10px] tracking-widest">+ ADD NEW</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low hairline-border p-6 rounded-lg relative group">
                  <div className="absolute top-6 right-6">
                    <span className="bg-white/10 text-[10px] font-label-caps px-2 py-1 rounded uppercase tracking-widest">DEFAULT</span>
                  </div>
                  <h4 className="font-label-caps text-label-caps mb-4 uppercase tracking-widest">HOME</h4>
                  <p className="text-on-surface-variant text-body-md mb-6 leading-relaxed uppercase">
                    {user?.name}<br/>
                    742 Evergreen Terrace<br/>
                    Manhattan, NY 10001<br/>
                    United States
                  </p>
                  <div className="flex gap-4 border-t border-white/5 pt-4">
                    <button className="font-label-caps text-[10px] text-on-surface/60 hover:text-on-surface transition-colors uppercase tracking-widest">EDIT</button>
                    <button className="font-label-caps text-[10px] text-on-surface/60 hover:text-on-surface transition-colors uppercase tracking-widest">REMOVE</button>
                  </div>
                </div>
                <div className="bg-surface-container-low hairline-border p-6 rounded-lg group">
                  <h4 className="font-label-caps text-label-caps mb-4 uppercase tracking-widest">OFFICE</h4>
                  <p className="text-on-surface-variant text-body-md mb-6 leading-relaxed uppercase">
                    Visionix Design Studio<br/>
                    450 5th Avenue, Suite 12<br/>
                    Manhattan, NY 10018<br/>
                    United States
                  </p>
                  <div className="flex gap-4 border-t border-white/5 pt-4">
                    <button className="font-label-caps text-[10px] text-on-surface/60 hover:text-on-surface transition-colors uppercase tracking-widest">SET AS DEFAULT</button>
                    <button className="font-label-caps text-[10px] text-on-surface/60 hover:text-on-surface transition-colors uppercase tracking-widest">EDIT</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Wishlist Section */}
          {(activeSection === 'profile' || activeSection === 'wishlist') && (
            <section className="space-y-8">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h2 className="font-display-lg text-headline-sm uppercase">Your Wishlist</h2>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{wishlistItems.length} ITEMS SAVED</p>
              </div>
              
              {wishlistItems.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-white/10 rounded-lg">
                   <span className="material-symbols-outlined text-[48px] text-white/10 mb-4">favorite</span>
                   <p className="text-on-surface-variant font-body-md mb-8">Your wishlist is currently empty.</p>
                   <Link to="/shop" className="bg-on-surface text-background px-10 py-4 font-label-caps text-label-caps hover:opacity-80 transition-opacity uppercase tracking-widest">Explore Collections</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                  {wishlistItems.map((product) => (
                    <div key={product.id} className="product-card group relative">
                      <div className="relative aspect-[3/4] bg-surface-container-lowest overflow-hidden mb-6 hairline-border">
                        <Link to={`/product/${product.id}`} className="block w-full h-full">
                          <img className="w-full h-full object-cover grayscale brightness-90 transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-100" src={resolveImage(product.image_url)} alt={product.name} />
                        </Link>
                        
                        <button 
                          onClick={() => toggleWishlist(product)}
                          className="absolute top-4 right-4 z-10 p-2 bg-background/50 backdrop-blur-md rounded-full"
                        >
                          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </button>

                        <div className="absolute inset-0 bg-black/20 flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto">
                          <button 
                            onClick={() => addToCart(product)} 
                            className="bg-white text-black px-8 py-3 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all min-w-[160px]"
                          >
                            Add to Bag
                          </button>
                          <Link to={`/try-on/${product.id}`} className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-3 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all min-w-[160px] text-center">Try-On</Link>
                        </div>
                      </div>
                      <div className="flex justify-between items-start px-2">
                        <div>
                          <h3 className="font-label-caps text-label-caps uppercase tracking-tight">{product.name}</h3>
                          <p className="font-body-md text-on-surface-variant/60 text-[12px] uppercase">{product.frame_style}</p>
                        </div>
                        <p className="font-label-caps text-on-surface text-[14px]">{formatCurrency(product.price, currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Recently Viewed Section */}
          {(activeSection === 'profile') && (
            <section className="space-y-6 pt-8">
              <h2 className="font-headline-sm text-headline-sm uppercase">Recently Viewed</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { title: 'LINEAR T3', category: 'OPTICAL', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBrLiYMjQwod2fnuC2ajSnZzf83rde9akP07oHrLYtXDEReFx_DFG6lfWqfma4fHBAJ8Nao9AQ0dId7sZbUNFdvYgTaJWqM9BIfJYNK2XT8Vx1DNvUiqfNZ1Psjgw2VD3uNsZbc0vbJiv6PH8rYdvUwWWS--mKhc48fmdFvtTtpEv0VQaQAXmzlcIrYNtRAItz0v4LNatled6H_JB4wfsA4CXC0x25D1Wu88RrpKUZIgVMHIKaUTc22fODd_I2x8qFtsOR8K6G55cH' },
                  { title: 'OBSIDIAN XL', category: 'SUNGLASSES', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4y2E9yDv2Y6C71ZQ5MTWKvYBe0ht8qd143QQOYjP0uAY299yjC55KTJBvCCa0m1iNmQ1V6yOwYqVMlq8BmJUfgGl6Xq4qy-lMi6FGa7uVHUYDg0gSAoEqeh8rt4tJsY_sZ-cyqUZwoTMDa5QMx2SBTnWnriMkLwBMlUSeBUiiHiuPvhqmlMPLfTpP3WwfUbfF5XqzvGtAIX_KPmeTnS-65TRIXknyK6dwzkarPRmyfgpbY3oMM4TeRiQgV_-3OXt3isD6UAbw2EhX' },
                  { title: 'MONOLITH 01', category: 'OPTICAL', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLhlNLAfztseJ2-8YREPb54sZokKpbz1d3WCJUecxP9gqwWnR6qlVg8ez63etcPEtklts4DYbadRw7mXPTrYnjW_X3WQxhwYerF6bmhtHNfqgFUzrI6Lfv_m_h6UgqOPaKRIlI2FOS6qiqJ2MuIN-jz1xK1atBPhGlO30-svYAWeqZ5-_u3DBHtnmeoQ7_TfKsnJTmduXlyrhxmDmozQgpqRrMSEGJZBziYUeAG-N6Kuj8u-Ekz2PNN5cS_PEzvnbT4Fkr0AvEKRCL' },
                  { title: 'CUSTOM ARCHIVE', category: 'ACCESSOIRES', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCby67HjQp1i41vkbZAy-fA2HuGfXQVpwBrKBb5POnM8Z-dx8KqS27jXwUZHSphnwacuY-YC_C6VzO1sOnIK2zf7e1mkrWYUcxnSvTZwajFZs8OIbYA1iMo_QynV8wCK5h1CRCnX_kMhRgHfItnld-YawBmFCVnFGZiwgHqp8G_DiBWRPAyv-OeQqqVUq4SsMx6bjOtq60WBhUC6h0y4o-Dp8SudngyfebENjJ9vPflZdSfQs0rQNO1gCAg9N7KWmGl78-MFiYLWwiw' }
                ].map((item) => (
                  <div key={item.title} className="space-y-3 group cursor-pointer">
                    <div className="aspect-[3/4] bg-surface-container-highest overflow-hidden">
                      <img alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={item.src} />
                    </div>
                    <div>
                      <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">{item.category}</p>
                      <h4 className="font-label-caps text-label-caps uppercase tracking-widest">{item.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
};

export default Profile;
