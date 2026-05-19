import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/common/Loading';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';

  // Dynamically resolve backend host for images
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');
  const resolveImage = (url) => {
    if (!url) return '';
    return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
  };

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!loading && product) {
      const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
      setSelectedSizeIndex(productSizes.length > 0 ? 0 : 0);

      const productColors = Array.isArray(product.colors) ? product.colors : [];
      if (productColors.length > 0) {
        const primaryColor = productColors.find(c => c.isPrimary) || productColors[0];
        const initialColor = typeof primaryColor === 'string'
          ? primaryColor
          : (primaryColor.name || primaryColor.hex || 'Standard');
        setSelectedColor(initialColor);
      }

      // Add to recently viewed in localStorage
      try {
        const recentList = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const filtered = recentList.filter(item => item.id !== product.id);
        const updated = [
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            category_name: product.category_name,
            frame_style: product.frame_style,
            material: product.material
          },
          ...filtered
        ].slice(0, 4);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update recently viewed:', e);
      }
    }
  }, [loading, product]);

  if (loading) return <Loading />;
  if (!product) return <div className="pt-32 text-center font-label-caps tracking-widest uppercase">Product not found.</div>;

  // Use the new dynamic images array or fallback to singular image_url
  const rawImages = (product.images && product.images.length > 0) ? product.images : [product.image_url];
  const galleryImages = rawImages.map(img => ({
    url: resolveImage(img),
    alt: product.name
  }));

  const colors = Array.isArray(product?.colors) 
    ? product.colors.map(c => typeof c === 'string' ? { name: c, hex: '#1A1A1A' } : { name: c.name || c.hex || 'Standard', hex: c.hex || '#1A1A1A', image_url: c.image_url || '' }) 
    : [];

  const parsedSizes = Array.isArray(product?.sizes)
    ? product.sizes.map((size) => {
        if (typeof size === 'string') {
          return {
            label: size,
            frame_width_mm: product?.frame_width_mm,
            frame_length_mm: product?.frame_length_mm
          };
        }
        return {
          label: size.label || size.name || 'Variant',
          frame_width_mm: size.frame_width_mm ?? size.width ?? product?.frame_width_mm,
          frame_length_mm: size.frame_length_mm ?? size.length ?? product?.frame_length_mm
        };
      })
    : [];

  const sizes = parsedSizes.length > 0
    ? parsedSizes
    : [{ label: 'Standard (48-22)', frame_width_mm: product?.frame_width_mm, frame_length_mm: product?.frame_length_mm }];

  const selectedSize = sizes[selectedSizeIndex] || sizes[0];

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color.name);
    if (color.image_url) {
      const resolvedUrl = resolveImage(color.image_url);
      const imgIndex = galleryImages.findIndex(img => img.url === resolvedUrl);
      if (imgIndex !== -1) {
        setActiveImage(imgIndex);
      }
    }
  };

  return (
    <main className="pt-32 pb-24 max-w-container-max mx-auto px-gutter">
      <nav className="mb-12">
        <ol className="flex items-center gap-2 font-label-caps text-label-caps text-on-surface/40">
          <li><Link className="hover:text-on-surface transition-colors" to="/">Home</Link></li>
          <li>/</li>
          <li><Link className="hover:text-on-surface transition-colors" to="/shop">Collections</Link></li>
          <li>/</li>
          <li className="text-on-surface uppercase">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
        <div className="md:col-span-7 flex flex-col-reverse md:flex-row gap-6">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar md:w-24 shrink-0">
            {galleryImages.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={`w-20 md:w-full aspect-square border overflow-hidden group transition-colors ${activeImage === idx ? 'border-on-surface' : 'border-white/10'}`}
              >
                <img 
                  className={`w-full h-full object-cover transition-all duration-500 ${activeImage === idx ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} 
                  src={img.url} 
                  alt={img.alt} 
                />
              </button>
            ))}
          </div>

          <div className="flex-1 relative aspect-[4/5] bg-surface-container-low border border-white/5 overflow-hidden">
            {galleryImages.length > 0 ? (
              <img 
                className="w-full h-full object-cover" 
                src={galleryImages[activeImage]?.url} 
                alt={galleryImages[activeImage]?.alt} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline font-label-caps text-[10px]">No Visual Available</div>
            )}
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col">
          <div className="mb-8">
            <span className="font-label-caps text-label-caps text-primary mb-4 block uppercase tracking-[0.2em]">{product.category_name || 'COLLECTION'}</span>
            <h1 className="font-display-lg text-[32px] md:text-[64px] text-on-surface mb-2 uppercase">{product.name}</h1>
            <p className="font-display-lg text-headline-sm text-on-surface/60">{formatCurrency(product.price, currency)}</p>
          </div>

          <div className="mb-10">
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="space-y-10 mb-12">
            {colors.length > 0 && (
              <div>
                <span className="font-label-caps text-label-caps text-on-surface block mb-4 uppercase">Frame Finish</span>
                <div className="flex gap-4">
                  {colors.map((color) => (
                    <button 
                      key={color.name}
                      onClick={() => handleColorSelect(color)}
                      className="group relative"
                      title={color.name}
                    >
                      <span 
                        className={`w-10 h-10 rounded-full block border border-white/20 p-1 transition-transform duration-300 group-hover:scale-105`} 
                        style={{ backgroundColor: color.hex }}
                      ></span>
                      {selectedColor === color.name && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full ring-4 ring-background"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between mb-4">
                <span className="font-label-caps text-label-caps text-on-surface uppercase">Size Selection</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {sizes.map((size, index) => (
                  <button 
                    key={size.label + index}
                    onClick={() => setSelectedSizeIndex(index)}
                    className={`flex-1 min-w-[120px] py-4 border font-label-caps text-label-caps transition-all ${selectedSizeIndex === index ? 'border-on-surface bg-on-surface text-background' : 'border-white/10 hover:border-white/30 text-on-surface'}`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[12px] text-on-surface-variant uppercase tracking-[0.2em]">
                Cadre: {selectedSize.frame_width_mm ?? '—'} x {selectedSize.frame_length_mm ?? '—'} mm
              </p>
            </div>
          </div>

           <div className="flex flex-col gap-4 mb-12">
            <div className="flex gap-4">
              <button 
                onClick={() => addToCart({ ...product, selectedColor, selectedSize: selectedSize?.label })}
                className="flex-[4] bg-white text-black py-6 font-label-caps text-label-caps hover:bg-white/80 transition-all duration-300 uppercase tracking-widest"
              >
                Add to Shopping Bag
              </button>
              <button 
                onClick={() => toggleWishlist(product)}
                className={`flex-1 border border-white/15 py-6 flex items-center justify-center transition-all duration-300 ${isInWishlist(product.id) ? 'bg-primary/10 border-primary/30' : 'hover:bg-white/5'}`}
              >
                <span 
                  className={`material-symbols-outlined text-2xl transition-all ${isInWishlist(product.id) ? 'text-primary scale-110' : 'text-on-surface'}`}
                  style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
            </div>
            {product.category_name && (product.category_name.toLowerCase().includes('sunglasses') || product.category_name.toLowerCase().includes('optical')) && (
              <Link 
                to={`/try-on/${product.id}`}
                className="w-full border border-white/15 py-6 font-label-caps text-label-caps flex items-center justify-center gap-3 hover:bg-white/5 transition-all duration-300 uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                Virtual Try-On
              </Link>
            )}
          </div>

          <div className="border-t border-white/10">
            <div className="border-b border-white/10 group">
              <button onClick={() => toggleAccordion(0)} className="w-full py-6 flex justify-between items-center text-left">
                <span className="font-label-caps text-label-caps text-on-surface uppercase">Technical Specs</span>
                <span className={`material-symbols-outlined transition-transform duration-300 ${openAccordion === 0 ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openAccordion === 0 ? 'max-h-40' : 'max-h-0'}`}>
                <div className="pb-6 text-on-surface-variant text-body-md space-y-2">
                  <p>• Material: Grade 5 Aerospace Titanium</p>
                  <p>• Hand-assembled in Tokyo, Japan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
