import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 1. Core State Derivation from URL
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const styles = searchParams.get('styles')?.split(',').filter(Boolean) || [];
  const materials = searchParams.get('materials')?.split(',').filter(Boolean) || [];
  const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : 0;
  const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 2000;

  // 2. Local UI State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [activeSwipeIndex, setActiveActiveSwipeIndex] = useState(0);
  const scrollRef = useRef(null);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';

  const [dbStyles, setDbStyles] = useState(['Aviator', 'Wayfarer', 'Round', 'Geometric']);
  const [dbMaterials, setDbMaterials] = useState(['Titanium', 'Acetate', 'Bio-Resin']);

  useEffect(() => {
    const fetchFilterMetadata = async () => {
      try {
        const [stylesRes, materialsRes] = await Promise.all([
          api.get('/metadata/frame-styles'),
          api.get('/metadata/materials')
        ]);
        if (Array.isArray(stylesRes.data) && stylesRes.data.length > 0) {
          setDbStyles(stylesRes.data.map(item => item.name));
        }
        if (Array.isArray(materialsRes.data) && materialsRes.data.length > 0) {
          setDbMaterials(materialsRes.data.map(item => item.name));
        }
      } catch (err) {
        console.error("Error fetching filter metadata:", err);
      }
    };
    fetchFilterMetadata();
  }, []);

  // Dynamically resolve backend host for images
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');
  const resolveImage = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
  };

  const canTryOn = (categoryName) => {
    if (!categoryName) return false;
    const name = categoryName.toLowerCase();
    return name.includes('sunglasses') || name.includes('optical');
  };

  // Local state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(search);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const debounceRef = useRef(null);

  // Sync local UI state when URL changes
  useEffect(() => {
    setLocalSearch(search);
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [search, minPrice, maxPrice]);

  // 3. Centralized Filter Update Logic
  const updateFilters = useCallback((updates) => {
    // We use the object approach for setSearchParams to be more consistent across versions
    const nextParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    if (!updates.page) nextParams.set('page', '1');
    
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // 4. Data Fetching
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiParams = new URLSearchParams();
        if (category) apiParams.append('category', category);
        if (search) apiParams.append('search', search);
        if (styles.length > 0) apiParams.append('frame_style', styles.join(','));
        if (materials.length > 0) apiParams.append('material', materials.join(','));
        if (minPrice > 0) apiParams.append('min_price', minPrice);
        if (maxPrice < 2000) apiParams.append('max_price', maxPrice);
        apiParams.append('sort', sort);
        apiParams.append('page', page);
        apiParams.append('limit', 9);

        const response = await api.get(`/products?${apiParams.toString()}`);
        setProducts(response.data.products || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.total || 0);
      } catch (err) {
        console.error("Shop Fetch Error:", err);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    fetchProducts();
  }, [category, search, sort, page, styles.join(','), materials.join(','), minPrice, maxPrice]);

  const handleScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 280 + 24; // Card width + gap
    const index = Math.round(scrollLeft / itemWidth);
    if (index !== activeSwipeIndex) {
      setActiveActiveSwipeIndex(index);
    }
  };

  // 5. Interaction Handlers
  const handleToggleStyle = (style) => {
    const current = styles.map(s => s.toLowerCase());
    const target = style.toLowerCase();
    let next;
    if (current.includes(target)) {
      next = styles.filter(s => s.toLowerCase() !== target);
    } else {
      next = [...styles, style];
    }
    updateFilters({ styles: next.join(',') });
  };

  const handleToggleMaterial = (material) => {
    const current = materials.map(m => m.toLowerCase());
    const target = material.toLowerCase();
    let next;
    if (current.includes(target)) {
      next = materials.filter(m => m.toLowerCase() !== target);
    } else {
      next = [...materials, material];
    }
    updateFilters({ materials: next.join(',') });
  };

  const handleLocalSearch = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateFilters({ search: val }), 500);
  };

  const handleLocalPrice = (e) => {
    const { name, value } = e.target;
    const num = Number(value);
    
    let nextMin = localMin;
    let nextMax = localMax;

    if (name === 'min') {
      nextMin = Math.min(num, localMax);
      setLocalMin(nextMin);
    } else {
      nextMax = Math.max(num, localMin);
      setLocalMax(nextMax);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFilters({ min_price: nextMin, max_price: nextMax });
    }, 600);
  };

  const handleClearAll = () => {
    setSearchParams(category ? { category } : {});
  };

  const SORT_OPTIONS = [
    { label: 'Featured / Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
  ];

  return (
    <>
      <main className="pt-32 pb-24 px-gutter max-w-container-max mx-auto">
      {/* Header */}
      <header className="mb-12">
        <nav className="flex items-center gap-2 mb-6 font-label-caps text-[10px] text-on-surface/40 uppercase tracking-widest">
          <Link className="hover:text-on-surface transition-colors" to="/">Home</Link>
          <span className="opacity-20">/</span>
          <Link className="hover:text-on-surface transition-colors" to="/shop">Shop</Link>
          {category && (
            <>
              <span className="opacity-20">/</span>
              <span className="text-on-surface capitalize">{category}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="font-display-lg text-[44px] md:text-[72px] mb-6 leading-tight tracking-tighter uppercase">
              {category || 'Collections'}
            </h1>
            <p className="font-body-md text-on-surface-variant/80 leading-relaxed max-w-xl">
              Showing {totalCount} architectural designs discovered in our archives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 self-start md:self-end w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30 text-[20px]">search</span>
              <input 
                type="text"
                placeholder="SEARCH MODELS..."
                value={localSearch}
                onChange={handleLocalSearch}
                className="w-full pl-12 pr-4 py-3 bg-on-surface/5 border border-outline-variant focus:border-on-surface transition-all font-label-caps text-[10px] tracking-widest outline-none uppercase"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative z-40">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-6 px-6 py-3 border border-on-surface/20 min-w-[240px] justify-between group hover:border-on-surface transition-all bg-surface"
              >
                <span className="font-label-caps text-[10px] tracking-widest uppercase text-on-surface/60">
                  SORT: <span className="text-on-surface ml-2">{SORT_OPTIONS.find(o => o.value === sort)?.label || 'Featured'}</span>
                </span>
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              
              {isSortOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setIsSortOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-full bg-surface-container border border-outline-variant shadow-2xl z-50">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updateFilters({ sort: opt.value });
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-6 py-4 font-label-caps text-[10px] tracking-widest uppercase transition-all hover:bg-on-surface hover:text-background ${sort === opt.value ? 'bg-on-surface/5 text-on-surface font-bold underline' : 'text-on-surface/60'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={() => setIsMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 px-6 py-3 border border-outline-variant font-label-caps text-[10px] tracking-widest uppercase w-full"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Filters { (styles.length + materials.length) > 0 && `(${styles.length + materials.length})` }
            </button>
          </div>
        </div>

        {/* Tags */}
        {(styles.length > 0 || materials.length > 0 || minPrice > 0 || maxPrice < 2000 || search) && (
          <div className="flex flex-wrap items-center gap-3 mt-10">
            <span className="font-label-caps text-[9px] text-on-surface/30 tracking-widest uppercase mr-2">Filters Applied:</span>
            {search && (
              <button onClick={() => updateFilters({ search: '' })} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:border-primary transition-colors uppercase font-label-caps text-[9px] tracking-widest">
                Search: {search} <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
            {styles.map(s => (
              <button key={s} onClick={() => handleToggleStyle(s)} className="flex items-center gap-2 px-3 py-1.5 bg-on-surface/5 border border-outline-variant hover:border-on-surface transition-colors uppercase font-label-caps text-[9px] tracking-widest">
                {s} <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            ))}
            {materials.map(m => (
              <button key={m} onClick={() => handleToggleMaterial(m)} className="flex items-center gap-2 px-3 py-1.5 bg-on-surface/5 border border-outline-variant hover:border-on-surface transition-colors uppercase font-label-caps text-[9px] tracking-widest">
                {m} <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            ))}
            {(minPrice > 0 || maxPrice < 2000) && (
              <button onClick={() => updateFilters({ min_price: null, max_price: null })} className="flex items-center gap-2 px-3 py-1.5 bg-on-surface/5 border border-outline-variant hover:border-on-surface transition-colors uppercase font-label-caps text-[9px] tracking-widest">
                {formatCurrency(minPrice, currency)} - {formatCurrency(maxPrice, currency)} <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
            <button onClick={handleClearAll} className="text-[9px] font-label-caps tracking-widest uppercase text-on-surface/40 hover:text-on-surface underline underline-offset-4 ml-2">Clear All</button>
          </div>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-gutter">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <div className="sticky top-28 space-y-12">
            {/* Style */}
            <section>
              <h3 className="font-label-caps text-[11px] mb-8 text-on-surface border-b border-outline-variant pb-2 uppercase tracking-[0.2em]">Frame Style</h3>
              <div className="space-y-4">
                {dbStyles.map((s) => (
                  <label key={s} className="flex items-center gap-4 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={styles.some(item => item.toLowerCase() === s.toLowerCase())}
                      onChange={() => handleToggleStyle(s)}
                      className="w-5 h-5 border border-on-surface/20 bg-transparent rounded-none checked:bg-on-surface checked:border-on-surface transition-all appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:text-[12px]"
                    />
                    <span className="font-label-caps text-[10px] tracking-widest uppercase text-on-surface/50 group-hover:text-on-surface transition-colors">{s}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Material */}
            <section>
              <h3 className="font-label-caps text-[11px] mb-8 text-on-surface border-b border-outline-variant pb-2 uppercase tracking-[0.2em]">Material</h3>
              <div className="space-y-4">
                {dbMaterials.map((m) => (
                  <label key={m} className="flex items-center gap-4 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={materials.some(item => item.toLowerCase() === m.toLowerCase())}
                      onChange={() => handleToggleMaterial(m)}
                      className="w-5 h-5 border border-on-surface/20 bg-transparent rounded-none checked:bg-on-surface checked:border-on-surface transition-all appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:text-[12px]"
                    />
                    <span className="font-label-caps text-[10px] tracking-widest uppercase text-on-surface/50 group-hover:text-on-surface transition-colors">{m}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Price */}
            <section>
              <h3 className="font-label-caps text-[11px] mb-8 text-on-surface border-b border-outline-variant pb-2 uppercase tracking-[0.2em]">Price Range</h3>
              <div className="space-y-10 pr-4">
                <div className="space-y-4">
                  <div className="flex justify-between font-label-caps text-[9px] tracking-widest uppercase opacity-40">
                    <span>MINIMUM</span>
                    <span>{formatCurrency(localMin, currency)}</span>
                  </div>
                  <input type="range" name="min" min="0" max="2000" step="50" value={localMin} onChange={handleLocalPrice} className="w-full h-[2px] bg-outline-variant appearance-none cursor-pointer accent-on-surface" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between font-label-caps text-[9px] tracking-widest uppercase opacity-40">
                    <span>MAXIMUM</span>
                    <span>{formatCurrency(localMax, currency)}</span>
                  </div>
                  <input type="range" name="max" min="0" max="2000" step="50" value={localMax} onChange={handleLocalPrice} className="w-full h-[2px] bg-outline-variant appearance-none cursor-pointer accent-on-surface" />
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-gutter">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-on-surface/5 mb-6"></div>
                  <div className="h-4 bg-on-surface/5 w-3/4 mb-3"></div>
                  <div className="h-4 bg-on-surface/5 w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {products.length > 0 ? (
                <>
                  {/* Mobile Horizontal Swipe View */}
                  <div className="md:hidden mb-12">
                    <div 
                      ref={scrollRef}
                      onScroll={handleScroll}
                      className="overflow-x-auto snap-x snap-mandatory -mx-gutter px-gutter pb-8 hide-scrollbar"
                    >
                      <div className="flex gap-6 w-max">
                        {products.map((p) => (
                          <div key={p.id} className="product-card group relative flex-shrink-0 w-[280px] snap-center">
                            <div className="relative aspect-[3/4] bg-surface-container-lowest overflow-hidden mb-6">
                              <Link to={`/product/${p.id}`} className="block w-full h-full">
                                <img className="w-full h-full object-cover grayscale brightness-90 transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-100" src={resolveImage(p.image_url)} alt={p.name} />
                              </Link>
                              
                              {/* Wishlist Heart */}
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleWishlist(p);
                                }}
                                className="absolute top-4 right-4 z-10 p-2 group/heart"
                              >
                                <span 
                                  className={`material-symbols-outlined text-[24px] transition-all duration-300 ${isInWishlist(p.id) ? 'text-primary scale-110' : 'text-white/40 group-hover/heart:text-white group-hover/heart:scale-110'}`}
                                  style={{ fontVariationSettings: isInWishlist(p.id) ? "'FILL' 1" : "'FILL' 0" }}
                                >
                                  favorite
                                </span>
                              </button>

                              <div 
                                onClick={() => navigate(`/product/${p.id}`)}
                                className="absolute inset-0 bg-black/20 flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto cursor-pointer"
                              >
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(p);
                                  }} 
                                  className="bg-white text-black px-8 py-3 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all min-w-[140px]"
                                >
                                  Quick Add
                                </button>
                                {canTryOn(p.category_name) && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/try-on/${p.id}`);
                                    }} 
                                    className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-3 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all min-w-[140px] text-center"
                                  >
                                    Virtual Try-On
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-start">
                                <Link to={`/product/${p.id}`}>
                                  <h3 className="font-display-lg text-[18px] mb-1 uppercase tracking-tight">{p.name}</h3>
                                  <p className="font-body-md text-on-surface-variant/60 text-[11px] tracking-widest uppercase">{p.frame_style} • {p.material}</p>
                                </Link>
                                <p className="font-label-caps text-on-surface text-[14px]">{formatCurrency(p.price, currency)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Dynamic Swipe Indicator */}
                    <div className="flex justify-center items-center gap-3 mt-4">
                      {products.slice(0, 9).map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 transition-all duration-500 rounded-full ${activeSwipeIndex === i ? 'w-8 bg-primary' : 'w-1.5 bg-on-surface/10'}`}
                        ></div>
                      ))}
                      {products.length > 9 && <span className="font-label-caps text-[8px] opacity-30">+{products.length - 9}</span>}
                    </div>
                    <p className="text-center font-label-caps text-[9px] text-on-surface/30 mt-6 tracking-[0.2em] animate-pulse">SWIPE TO EXPLORE</p>
                  </div>

                  {/* Desktop Grid View */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-gutter">
                    {products.map((p) => (
                      <div key={p.id} className="product-card group relative">
                        <div className="relative aspect-[3/4] bg-surface-container-lowest overflow-hidden mb-6">
                          <Link to={`/product/${p.id}`} className="block w-full h-full">
                            <img className="w-full h-full object-cover grayscale brightness-90 transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-100" src={resolveImage(p.image_url)} alt={p.name} />
                          </Link>
                          
                          {/* Wishlist Heart */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(p);
                            }}
                            className="absolute top-4 right-4 z-10 p-2 group/heart"
                          >
                            <span 
                              className={`material-symbols-outlined text-[24px] transition-all duration-300 ${isInWishlist(p.id) ? 'text-primary scale-110' : 'text-white/40 group-hover/heart:text-white group-hover/heart:scale-110'}`}
                              style={{ fontVariationSettings: isInWishlist(p.id) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                          </button>

                          <div 
                            onClick={() => navigate(`/product/${p.id}`)}
                            className="absolute inset-0 bg-black/20 flex flex-col gap-2 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto cursor-pointer"
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p);
                              }} 
                              className="bg-white text-black px-10 py-4 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all min-w-[180px]"
                            >
                              Quick Add
                            </button>
                            {canTryOn(p.category_name) && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/try-on/${p.id}`);
                                }} 
                                className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-10 py-4 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all min-w-[180px] text-center"
                              >
                                Virtual Try-On
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <Link to={`/product/${p.id}`}>
                              <h3 className="font-display-lg text-[20px] mb-1 uppercase tracking-tight">{p.name}</h3>
                              <p className="font-body-md text-on-surface-variant/60 text-[12px] tracking-widest uppercase">{p.frame_style} • {p.material}</p>
                            </Link>
                            <p className="font-label-caps text-on-surface text-[14px]">{formatCurrency(p.price, currency)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-outline-variant">
                  <span className="material-symbols-outlined text-[64px] text-on-surface/10 mb-6 font-thin">search_off</span>
                  <h3 className="font-display-lg text-headline-sm mb-4 uppercase">No designs found</h3>
                  <p className="font-body-md text-on-surface-variant/60 mb-10 max-w-sm mx-auto">Try adjusting your filters to explore other architectural optics.</p>
                  <button onClick={handleClearAll} className="px-10 py-4 bg-on-surface text-background font-label-caps text-[10px] tracking-[0.2em] uppercase hover:opacity-80 transition-all">Reset All Filters</button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-32 flex items-center justify-between border-t border-outline-variant pt-16">
                  <button onClick={() => updateFilters({ page: page - 1 })} disabled={page === 1} className="font-label-caps text-[10px] tracking-widest uppercase disabled:opacity-10 flex items-center gap-4 group">
                    <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-2">west</span> PREVIOUS
                  </button>
                  <div className="hidden sm:flex items-center gap-12">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i + 1} onClick={() => updateFilters({ page: i + 1 })} className={`font-label-caps text-[11px] tracking-widest transition-all ${page === i + 1 ? 'text-on-surface border-b border-on-surface pb-2' : 'text-on-surface/20 hover:text-on-surface'}`}>
                        {(i + 1).toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => updateFilters({ page: page + 1 })} disabled={page === totalPages} className="font-label-caps text-[10px] tracking-widest uppercase disabled:opacity-10 flex items-center gap-4 group">
                    NEXT <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-2">east</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>

    {/* Mobile Modal - Rendered outside main container to avoid layout/transform positioning issues */}
    {isMobileFiltersOpen && (
      <div className="fixed inset-0 z-[100] bg-background text-on-surface md:hidden p-gutter overflow-y-auto">
        <div className="flex justify-between items-center mb-12">
          <h2 className="font-display-lg text-headline-sm uppercase text-on-surface">Filters</h2>
          <button onClick={() => setIsMobileFiltersOpen(false)} className="material-symbols-outlined text-[32px] text-on-surface hover:text-primary transition-colors">close</button>
        </div>
        <div className="space-y-16 pb-24">
           <div>
            <h3 className="font-label-caps text-[12px] mb-8 border-b border-outline-variant pb-2 uppercase tracking-[0.2em] text-on-surface">Frame Style</h3>
            <div className="grid grid-cols-2 gap-4">
              {dbStyles.map((s) => (
                <button key={s} onClick={() => handleToggleStyle(s)} className={`px-4 py-4 border font-label-caps text-[10px] tracking-widest uppercase transition-all ${styles.some(item => item.toLowerCase() === s.toLowerCase()) ? 'bg-on-surface text-background border-on-surface' : 'border-outline-variant text-on-surface/60 hover:text-on-surface'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-label-caps text-[12px] mb-8 border-b border-outline-variant pb-2 uppercase tracking-[0.2em] text-on-surface">Material</h3>
            <div className="grid grid-cols-2 gap-4">
              {dbMaterials.map((m) => (
                <button key={m} onClick={() => handleToggleMaterial(m)} className={`px-4 py-4 border font-label-caps text-[10px] tracking-widest uppercase transition-all ${materials.some(item => item.toLowerCase() === m.toLowerCase()) ? 'bg-on-surface text-background border-on-surface' : 'border-outline-variant text-on-surface/60 hover:text-on-surface'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="fixed bottom-0 left-0 w-full p-gutter bg-background border-t border-outline-variant flex gap-4">
            <button onClick={() => setIsMobileFiltersOpen(false)} className="flex-1 py-5 bg-on-surface text-background font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-on-surface/90 transition-all">Show Results</button>
            <button onClick={handleClearAll} className="flex-1 py-5 border border-outline-variant font-label-caps text-[10px] tracking-[0.2em] uppercase hover:border-on-surface transition-all text-on-surface">Clear</button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Shop;
