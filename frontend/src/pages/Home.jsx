import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';

const Home = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamically resolve backend host for images
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');
  const resolveImage = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products?limit=4');
        console.log("Products fetched successfully:", response.data.products);
        setProducts(response.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt=""
            className="w-full h-full object-cover brightness-50 animate-image-reveal"
            data-alt="A cinematic close-up of avant-garde architectural eyeglasses..."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwX1CmMaN9fo8f0tvzJA4nOSHr155gHaX9GtUfYh2R0AV_dU_do-FoN4eBb4tT-HmaDKNb6_BwybPJvHWWiAbxNxjT3LWFlfkla7pqPrXBLZyP2Aej3mk9uhOp94g7XqM7k10hpNUOBJ5igTFsqAU-Tl9sNUqK30YipDoA0TqJooIQNo1SHUyKoWrkmNm0EvQvOQyjs8ZUkqknzHpULEeOZ4aeJox5PVc6bw9sAjGkyU9tr02Z7qyNfiVrmawuyqN84KaSdgtBxw_r"
          />
        </div>
        <div className="relative z-10 text-center px-gutter">
          <p className="font-label-caps text-label-caps tracking-[0.4em] mb-6 text-primary uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {settings.site_tagline || 'THE NEW ARCHITECTURE'}
          </p>
          <h1 className="font-display-lg text-[48px] md:text-[80px] text-on-surface mb-10 max-w-4xl mx-auto leading-tight">
            Sculpted Vision for the Modern Vanguard.
          </h1>
          <Link
            to="/shop"
            className="inline-block bg-on-surface text-on-primary px-12 py-5 font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-300"
          >
            NEW COLLECTION
          </Link>
        </div>
      </section>

      {/* Categories: Visual Tiles */}
      <section className="py-24 px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/shop?category=optical" className="group relative aspect-[4/5] overflow-hidden">
            <img
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-image-reveal"
              data-alt="A sophisticated editorial portrait..."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOXt-U9td8Fb3moj5tmwwKxnS6kLamAgv4yIwtZIaG2-TnuK1OtyzXhj-wLmMlZWSRYC3UEm5ZM0Bp2xDFN9evWzX1xl6gCKyb2JHQnIheBbdbSgYX4hJaGEzqO1wXMvTYT9d2k72wgr-ei3cRWxyXoNSgFsZFHyWF5Im1Ne3C-ydtl9n9CCKW5ntqC5-aup6KesAPyx4tqknirX9Jkhv-RyHhEMEgj75GiiWnvFqC5MoK4Fj7Kp9lxL6DUR4lKxmTmdjckd-ZewSp"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8">
              <h3 className="font-headline-sm text-on-surface mb-2">Optical</h3>
              <p className="font-label-caps text-label-caps text-on-surface/70">Technical Clarity</p>
            </div>
          </Link>
          <Link to="/shop?category=sunglasses" className="group relative aspect-[4/5] overflow-hidden">
            <img
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-image-reveal"
              data-alt="A bold, high-contrast shot..."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQtEiHec3WwcD3J_PS4LoX7Z6TlGePWqDfvkUwAQ6cM7SsGL6oOfxqGrpd7LVtfcXLPYEBsRisVnZWHjEYX38EW8uj7aKxjUvD-nS_1Cd-sHJKCs8W6iE2SsY1QVZPeLFNGqT1yyTBr87zHBpg3NvOgK0VKLcGm0nTiKb_OyOkNl9pd5Yrf9xljink3axqfMTzmv8hIhmd4-jjYc6QM2kAANRwJH7E1atTC7ZcMk73PIj7TUXS0LbvBwc916NIp6rG_ThKLD6HNNae"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8">
              <h3 className="font-headline-sm text-on-surface mb-2">Sunglasses</h3>
              <p className="font-label-caps text-label-caps text-on-surface/70">Sculpted Protection</p>
            </div>
          </Link>
          <Link to="/shop?category=accessoires" className="group relative aspect-[4/5] overflow-hidden">
            <img
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 animate-image-reveal"
              data-alt="An artisan's workbench..."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBulbmKaKwX9Cp3eb_mRh0pZslxkKO9I-ymfXiYdh5ZfF5Sl00JNwQ3VOQg8qnX05e2q0lKjNQ1I8a_YW1ii2v8ZTudfdQZhS2DzacsX1dzKLM8JTgGanLHpLzIbqph8Ke2hMTc0JKGTVvIWOoJlZXBIKxgrWrgCJ8gexfrEvGZBE63uILm5fI4jKgrIf0yPwJkyvKyroskksGZe3qKCAWuoCfyvJIGi2gQhuV_lx8145kNIf7qDqw4oT6I0gCEpxmPo9E_JUxbwyah"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
            <div className="absolute bottom-8 left-8">
              <h3 className="font-headline-sm text-on-surface mb-2">Accessoires</h3>
              <p className="font-label-caps text-label-caps text-on-surface/70">Tailored Precision</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="px-gutter max-w-container-max mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <p className="font-label-caps text-label-caps text-primary mb-4">THE CURATED EDIT</p>
              <h2 className="font-headline-md text-on-surface">Precision Masterpieces</h2>
            </div>
            <Link
              to="/shop"
              className="font-label-caps text-label-caps border-b border-on-surface-variant text-on-surface-variant hover:text-on-surface transition-colors pb-1"
            >
              VIEW ALL
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-4 md:p-6 animate-pulse">
                  <div className="aspect-square bg-white/5 mb-4 md:mb-8"></div>
                  <div className="h-3 bg-white/5 w-1/2 mb-2"></div>
                  <div className="h-4 bg-white/5 w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {products.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`} className="glass-card p-4 md:p-6 transition-all duration-500 hover:-translate-y-2 group flex flex-col">
                  <div className="aspect-square bg-white/5 mb-4 md:mb-8 overflow-hidden relative">
                    <img
                      alt={product.name}
                      className="w-full h-full object-cover mix-blend-screen group-hover:scale-110 transition-transform duration-500"
                      src={resolveImage(product.image_url)}
                    />
                    {/* Action Overlay for Desktop */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 hidden md:flex">
                       <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <p className="font-label-caps text-[9px] md:text-label-caps text-on-surface-variant mb-1 md:mb-2 uppercase tracking-widest">{product.category_name || 'COLLECTION'}</p>
                    <h4 className="font-headline-sm text-[14px] md:text-headline-sm text-on-surface mb-2 md:mb-4 uppercase line-clamp-1">{product.name}</h4>
                  </div>

                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                    <span className="font-body-md text-[12px] md:text-body-md text-on-surface/80">{formatCurrency(product.price, currency)}</span>
                    <div className="flex gap-2 md:gap-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        className="material-symbols-outlined text-[18px] md:text-[24px] transition-all duration-300"
                        style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0", color: isInWishlist(product.id) ? 'var(--color-primary)' : 'inherit' }}
                      >
                        favorite
                      </button>
                      {/* Mobile-only Quick Add */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="md:hidden material-symbols-outlined text-[18px] text-on-surface/60 active:text-primary transition-colors"
                      >
                        add_shopping_cart
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ... (rest of sections) ... */}
      <section className="py-24 px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10 overflow-hidden">
          <div className="bg-surface-container-high p-16 flex flex-col justify-center">
            <p className="font-label-caps text-label-caps text-primary mb-6">FUTURE VISION</p>
            <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md mb-8 uppercase">AI Mirror: Virtual Fitting Reimagined</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-md">Experience our collections in high-fidelity 3D. Our proprietary AI Virtual Try-On maps your unique facial architecture with sub-millimeter precision.</p>
            <div className="flex gap-6">
              <Link to="/try-on" className="bg-on-surface text-background px-8 py-4 font-label-caps text-label-caps hover:opacity-80 transition-opacity uppercase tracking-widest text-center">LAUNCH VIRTUAL MIRROR</Link>
            </div>
          </div>
          <div className="relative min-h-[400px]">
            <img
              alt=""
              className="absolute inset-0 w-full h-full object-cover grayscale"
              data-alt="A clean, futuristic display..."
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmj1nULSJc7xFX_ROKH7AecgqNk6Dor1pzpugsM7N3M6PqFxVA8YhaGs2ryYolC258VEYCLXpdDhp2ZmFti-cgU6r5GkAplFTO5AIlO5CkhUvwAL8QCKIWZjwI4C-HwzLAS5xOuNT9ZDnHIxR531moS53KafPUBGPbChSgYzN0_KZo8d8SFrVajwNVoAkGEv8nC9aM0dUUEUtzsrTd_32TtyM-XOzgfyoGSrY-ZqugHq0QxKZorFsCVxl7Lqa9423F5MfqilcKpZWJ"
            />
          </div>
        </div>
      </section>

      <section className="py-32 bg-background border-y border-white/5">
        <div className="px-gutter max-w-3xl mx-auto text-center">
          <span className="material-symbols-outlined text-primary text-[48px] mb-8" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
          <p className="font-display-lg text-headline-md md:text-[40px] italic leading-tight mb-12">"Visionix isn't just eyewear; it's a piece of architectural engineering for the face. The precision and weightlessness are unparalleled."</p>
          <p className="font-label-caps text-label-caps tracking-widest text-primary">MARCUS CHEN — ARCHITECTURAL LEAD, GENESIS FIRM</p>
        </div>
      </section>

      <section className="py-24 px-gutter max-w-container-max mx-auto text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-headline-md text-on-surface mb-6">Private Access</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-10">Join our inner circle for exclusive previews of limited drops and bespoke technical releases.</p>
          <form className="flex flex-col md:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
            <input
              className="flex-1 bg-surface-container-low border border-white/10 px-6 py-4 font-label-caps text-label-caps focus:border-on-surface focus:ring-0 outline-none transition-colors"
              placeholder="ENTER YOUR EMAIL"
              type="email"
            />
            <button className="bg-on-surface text-on-primary px-10 py-4 font-label-caps text-label-caps hover:opacity-80 transition-opacity whitespace-nowrap" type="submit">SUBSCRIBE</button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Home;
