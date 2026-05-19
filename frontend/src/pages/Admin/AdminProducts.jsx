import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { FRAME_STYLES, FRAME_MATERIALS } from '../../utils/frameOptions';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [frameStylesList, setFrameStylesList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showAlert, showConfirm } = useAlert();

  // Dynamically resolve backend host from API configuration
  const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    images: [],
    category_id: '',
    stock: 50,
    frame_style: FRAME_STYLES[0],
    material: FRAME_MATERIALS[0],
    frame_style_id: null,
    material_id: null,
    is_active: 1,
    colors: [],
    sizes: []
  });

  const frameStyleOptions = frameStylesList.length > 0
    ? frameStylesList.map(fs => ({ value: fs.id, label: fs.name }))
    : FRAME_STYLES.map(name => ({ value: name, label: name }));

  const materialOptions = materialsList.length > 0
    ? materialsList.map(m => ({ value: m.id, label: m.name }))
    : FRAME_MATERIALS.map(name => ({ value: name, label: name }));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      // Ensure products is always an array
      const productData = response.data.products || (Array.isArray(response.data) ? response.data : []);
      setProducts(productData);
    } catch (err) {
      console.error("Fetch products error:", err);
      showAlert("Failed to load inventory.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [fsRes, mRes] = await Promise.all([
        api.get('/metadata/frame-styles'),
        api.get('/metadata/materials')
      ]);
      setFrameStylesList(Array.isArray(fsRes.data) ? fsRes.data : []);
      setMaterialsList(Array.isArray(mRes.data) ? mRes.data : []);
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (frameStylesList.length && !productForm.frame_style_id && productForm.frame_style) {
      const found = frameStylesList.find(fs => fs.name === productForm.frame_style);
      if (found) {
        setProductForm(prev => ({ ...prev, frame_style_id: found.id }));
      }
    }
    if (materialsList.length && !productForm.material_id && productForm.material) {
      const found = materialsList.find(m => m.name === productForm.material);
      if (found) {
        setProductForm(prev => ({ ...prev, material_id: found.id }));
      }
    }
  }, [frameStylesList, materialsList, productForm.frame_style, productForm.material]);

  // Body scroll lock when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if ((productForm.images?.length || 0) + files.length > 5) {
      showAlert("Visual limit reached. Maximum 5 assets per model.", "info");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    try {
      setUploading(true);
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProductForm(prev => ({ ...prev, images: [...(prev.images || []), ...data.imageUrls].slice(0, 5) }));
    } catch (err) {
      showAlert("Upload failed. Ensure valid image formats.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleColorImageUpload = async (index, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('images', file);

    try {
      setUploading(true);
      const { data } = await api.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = data.imageUrls[0];
      setProductForm(prev => {
        const newColors = [...prev.colors];
        newColors[index] = { ...newColors[index], image_url: imageUrl };
        return { ...prev, colors: newColors };
      });
    } catch (err) {
      showAlert("Color image upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const addColor = () => setProductForm(prev => ({ 
    ...prev, 
    colors: [...prev.colors, { id: Date.now(), name: '', hex: '#000000', image_url: '', isPrimary: prev.colors.length === 0 }] 
  }));

  const removeColor = (index) => setProductForm(prev => {
    const newColors = [...prev.colors];
    newColors.splice(index, 1);
    // Auto re-assign primary if needed
    if (newColors.length > 0 && !newColors.some(c => c.isPrimary)) newColors[0].isPrimary = true;
    return { ...prev, colors: newColors };
  });

  const updateColor = (index, field, value) => setProductForm(prev => {
    const newColors = [...prev.colors];
    newColors[index] = { ...newColors[index], [field]: value };
    return { ...prev, colors: newColors };
  });

  const setPrimaryColor = (index) => setProductForm(prev => {
    const newColors = prev.colors.map((c, i) => ({ ...c, isPrimary: i === index }));
    return { ...prev, colors: newColors };
  });

  const addSize = () => setProductForm(prev => ({
    ...prev,
    sizes: [...(prev.sizes || []), { id: Date.now() + Math.random(), label: '', frame_width_mm: '', frame_length_mm: '' }]
  }));

  const removeSize = (index) => setProductForm(prev => {
    const newSizes = [...(prev.sizes || [])];
    newSizes.splice(index, 1);
    return { ...prev, sizes: newSizes };
  });

  const updateSize = (index, field, value) => setProductForm(prev => {
    const newSizes = [...(prev.sizes || [])];
    newSizes[index] = { ...newSizes[index], [field]: value };
    return { ...prev, sizes: newSizes };
  });

  const removeImage = (imgUrl) => {
    setProductForm(prev => ({
      ...prev,
      images: (prev.images || []).filter(img => img !== imgUrl)
    }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setProductForm({
      name: '',
      description: '',
      price: '',
      images: [],
      category_id: categories[0]?.id || '',
      stock: 50,
      frame_style: FRAME_STYLES[0],
      material: FRAME_MATERIALS[0],
      frame_style_id: frameStylesList[0]?.id || null,
      material_id: materialsList[0]?.id || null,
      is_active: 1,
      colors: [],
      sizes: []
    });

    setShowModal(true);
  };

  const openEditModal = async (product) => {
    try {
      const response = await api.get(`/products/${product.id}`);
      setModalMode('edit');
      const data = response.data;
      let parsedColors = [];
      try {
        parsedColors = typeof data.colors === 'string' ? JSON.parse(data.colors) : (data.colors || []);
      } catch (e) { parsedColors = []; }

      let parsedSizes = [];
      try {
        parsedSizes = typeof data.sizes === 'string' ? JSON.parse(data.sizes) : (data.sizes || []);
      } catch (e) { parsedSizes = []; }

      setProductForm({
        ...data,
        images: (data.images || (data.image_url ? [data.image_url] : [])).slice(0, 5),
        frame_style: data.frame_style ?? FRAME_STYLES[0],
        material: data.material ?? FRAME_MATERIALS[0],
        frame_style_id: (frameStylesList.find(fs => fs.name === data.frame_style) || {}).id || null,
        material_id: (materialsList.find(m => m.name === data.material) || {}).id || null,
        colors: Array.isArray(parsedColors) 
          ? parsedColors.map(c => typeof c === 'string' ? { id: Date.now() + Math.random(), name: c, hex: '#000000', image_url: '', isPrimary: false } : c) 
          : [],
        sizes: Array.isArray(parsedSizes)
          ? parsedSizes.map((size) => {
              if (typeof size === 'string') {
                return { id: Date.now() + Math.random(), label: size, frame_width_mm: '', frame_length_mm: '' };
              }
              return {
                id: size.id || Date.now() + Math.random(),
                label: size.label || size.name || '',
                frame_width_mm: size.frame_width_mm ?? size.width ?? '',
                frame_length_mm: size.frame_length_mm ?? size.length ?? ''
              };
            })
          : []
      });
      setModalMode('edit');
      setShowModal(true);
    } catch (err) {
      showAlert("Failed to load architectural specifications.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const primaryColor = productForm.colors?.find(c => c.isPrimary);
    const primaryImg = primaryColor?.image_url || (productForm.images?.[0] || null);
    
    const colorImages = (productForm.colors || []).filter(c => c.image_url && c.image_url !== primaryImg).map(c => c.image_url);
    const manualImages = (productForm.images || []).filter(img => img !== primaryImg);
    const secondaryImages = [...new Set([...colorImages, ...manualImages])].slice(0, 4);

    let finalImages = [];
    if (primaryImg) finalImages.push(primaryImg);
    finalImages = [...finalImages, ...secondaryImages];

    if (finalImages.length === 0) {
      showAlert("At least one visual asset is required for curation.", "info");
      return;
    }

    const normalizedSizes = (productForm.sizes || []).map((size) => {
      const label = typeof size === 'string' ? size.trim() : (size.label || '').trim();
      return {
        label,
        frame_width_mm: size.frame_width_mm === '' ? null : Number(size.frame_width_mm),
        frame_length_mm: size.frame_length_mm === '' ? null : Number(size.frame_length_mm)
      };
    }).filter(size => size.label);

    const payload = {
      ...productForm,
      sizes: normalizedSizes,
    };

    try {
      const isAdd = modalMode === 'add';
      const url = isAdd ? '/products' : `/products/${productForm.id}`;
      const method = isAdd ? 'post' : 'put';

      await api[method](url, { ...payload, images: finalImages });
      
      showAlert(`Product ${isAdd ? 'added' : 'updated'} successfully`, 'success');
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Product submit error:', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Action failed: synchronization error';
      showAlert(serverMessage, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm({
      title: 'Decommission Product?',
      message: `Are you sure you want to remove ${name} from active circulation?`,
      confirmText: 'Decommission',
      cancelText: 'Preserve'
    });

    if (confirmed) {
      try {
        await api.delete(`/products/${id}`);
        showAlert(`${name} decommissioned successfully.`);
        fetchProducts();
      } catch (err) {
        showAlert("Decommissioning failed.", "error");
      }
    }
  };

  return (
    <div className="space-y-gutter animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="font-display-lg text-headline-sm md:text-headline-md uppercase">Product Registry</h2>
          <p className="font-label-caps text-outline text-[10px] mt-1 uppercase tracking-widest">Inventory Oversight & Asset Management</p>
        </div>
        <button
          onClick={openAddModal}
          disabled={loading}
          className="w-full md:w-auto px-8 py-3 bg-on-surface text-background font-label-caps text-[10px] tracking-widest hover:opacity-90 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Curate New Model
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-on-surface animate-spin mb-4"></div>
          <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Loading inventory…</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="font-label-caps text-[10px] text-outline tracking-widest border-b border-white/5">
                    <th className="px-8 py-4 font-semibold uppercase">Architectural Model</th>
                    <th className="px-8 py-4 font-semibold uppercase">Category</th>
                    <th className="px-8 py-4 font-semibold uppercase text-center">Valuation</th>
                    <th className="px-8 py-4 font-semibold uppercase text-center">Sizes</th>
                    <th className="px-8 py-4 font-semibold uppercase text-center">In Stock</th>
                    <th className="px-8 py-4 font-semibold uppercase text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-label-caps text-[11px]">
                  {(products || []).map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-container rounded-sm overflow-hidden border border-white/5">
                            <img
                              alt={p.name}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                              src={p.image_url?.startsWith('/') ? `${BACKEND_URL}${p.image_url}` : (p.images?.[0]?.startsWith('/') ? `${BACKEND_URL}${p.images[0]}` : (p.image_url || p.images?.[0]))}
                            />
                          </div>
                          <span className="uppercase tracking-wide">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-outline uppercase tracking-wider">{p.category_name || 'Visionix Core'}</td>
                      <td className="px-8 py-5 text-center font-semibold text-tertiary">{formatCurrency(p.price, currency)}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-outline">
                          {(() => {
                            let parsed = [];
                            try {
                              parsed = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : (p.sizes || []);
                            } catch (e) { parsed = []; }
                            return parsed.map(s => typeof s === 'string' ? s : (s.label || s.name || '')).filter(Boolean).join(', ') || '—';
                          })()}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-sm border ${p.stock < 10 ? 'border-error/30 text-error bg-error/5' : 'border-white/10 text-on-surface'}`}>
                          {p.stock} Units
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-6 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openEditModal(p)} className="text-outline hover:text-on-surface underline decoration-1 underline-offset-8 uppercase transition-all">Edit</button>
                          <button onClick={() => handleDelete(p.id, p.name)} className="text-error/40 hover:text-error underline decoration-1 underline-offset-8 uppercase transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {(products || []).map((p) => (
              <div key={p.id} className="glass-card p-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-surface-container rounded-sm overflow-hidden border border-white/5 flex-shrink-0">
                    <img
                      alt={p.name}
                      className="w-full h-full object-cover"
                      src={p.image_url?.startsWith('/') ? `${BACKEND_URL}${p.image_url}` : (p.images?.[0]?.startsWith('/') ? `${BACKEND_URL}${p.images[0]}` : (p.image_url || p.images?.[0]))}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display-lg text-headline-sm uppercase truncate">{p.name}</h4>
                    <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest">{p.category_name || 'Visionix Core'}</p>
                    <p className="font-headline-sm text-tertiary mt-2">{formatCurrency(p.price, currency)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Inventory</p>
                    <p className={`font-label-caps text-[11px] mt-1 ${p.stock < 10 ? 'text-error' : 'text-on-surface'}`}>{p.stock} Units</p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Sizes</p>
                    <p className="font-label-caps text-[11px] mt-1 uppercase text-outline">
                      {(() => {
                        let parsed = [];
                        try {
                          parsed = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : (p.sizes || []);
                        } catch (e) { parsed = []; }
                        return parsed.map(s => typeof s === 'string' ? s : (s.label || s.name || '')).filter(Boolean).join(', ') || '—';
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-white/5 pt-4">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex-1 py-3 border border-white/10 font-label-caps text-[10px] tracking-widest uppercase hover:bg-white/5 transition-all"
                  >
                    Refine
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="flex-1 py-3 border border-error/20 text-error/60 font-label-caps text-[10px] tracking-widest uppercase hover:bg-error/5 transition-all"
                  >
                    Decommission
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(products || []).length === 0 && !loading && (
            <div className="glass-card py-20 text-center text-outline uppercase tracking-[0.3em] text-[10px]">
              No models found in the active registry.
            </div>
          )}

          {/* Modal Interface */}
          {showModal && (
            <div className="fixed inset-0 z-[300] transition-all duration-500">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" 
                onClick={() => setShowModal(false)}
              ></div>
              
              {/* Modal Container */}
              <div className="absolute inset-0 md:inset-6 lg:inset-10 xl:inset-x-[15%] xl:inset-y-[5%] bg-background border-y md:border border-white/10 flex flex-col shadow-2xl animate-in md:zoom-in-95 slide-in-from-bottom-full md:slide-in-from-bottom-0 duration-500 max-h-[90vh] h-full md:h-auto overflow-hidden md:rounded-sm">
                
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-5 border-b border-white/5 bg-surface-container-low z-20 shrink-0">
                  <div>
                    <h3 className="font-display-lg text-[20px] uppercase tracking-tight">
                      {modalMode === 'add' ? 'Curate Model' : 'Refine Specs'}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface transition-all p-2 bg-white/5 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Grid Scrollable Area */}
                <div className="flex-1 min-h-0 w-full grid grid-cols-1 md:grid-cols-5 bg-background overflow-auto md:overflow-hidden modal-scrollable">
                  
                  {/* Global Gallery Sidebar */}
                  <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-white/5 bg-surface-container-low overflow-y-auto hide-scrollbar relative">
                    <div className="hidden md:flex p-6 md:p-8 sticky top-0 bg-surface-container-low z-10 border-b border-white/5 justify-between items-center">
                      <div>
                        <h3 className="font-display-lg text-headline-sm uppercase tracking-tight">Global Gallery</h3>
                        <p className="font-label-caps text-[10px] text-outline uppercase mt-1 tracking-widest">Primary & Extra Angles</p>
                      </div>
                    </div>
                    
                    <div className="p-5 md:p-8 space-y-6">
                      <div className="md:hidden flex justify-between items-end border-b border-white/5 pb-2">
                        <h4 className="font-label-caps text-[12px] uppercase tracking-[0.2em] text-on-surface">Global Gallery</h4>
                        <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">{(productForm.images?.length || 0)}/5 Uploaded</p>
                      </div>

                      {/* Main Image Preview */}
                      <div className="aspect-square bg-surface-container-lowest rounded-sm overflow-hidden border border-white/10 relative group shadow-inner">
                        {(() => {
                          const primaryColor = productForm.colors?.find(c => c.isPrimary);
                          const primaryImg = primaryColor?.image_url || (productForm.images && productForm.images.length > 0 ? productForm.images[0] : null);
                          
                          return primaryImg ? (
                            <>
                              <img
                                src={primaryImg.startsWith('/') ? `${BACKEND_URL}${primaryImg}` : primaryImg}
                                alt="Primary asset"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-black px-2 py-1.5 text-[10px] font-label-caps uppercase tracking-[0.2em] text-center">Primary View</div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-outline/40">
                              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">imagesmode</span>
                              <span className="font-label-caps text-[10px] tracking-widest uppercase">No Primary Asset</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Secondary Images Grid */}
                      <div className="space-y-2">
                        {(() => {
                          const primaryColor = productForm.colors?.find(c => c.isPrimary);
                          const primaryImg = primaryColor?.image_url || (productForm.images?.[0] || null);
                          
                          const colorImages = (productForm.colors || []).filter(c => c.image_url && c.image_url !== primaryImg).map(c => c.image_url);
                          const manualImages = (productForm.images || []).filter(img => img !== primaryImg);
                          const secondaryImages = [...new Set([...colorImages, ...manualImages])].slice(0, 4);

                          return (
                            <>
                              <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Model Gallery ({secondaryImages.length}/4 slots)</p>
                              <div className="grid grid-cols-4 gap-2 md:gap-3">
                                {secondaryImages.map((img, idx) => {
                                  const isColorImg = (productForm.colors || []).some(c => c.image_url === img);
                                  return (
                                    <div key={idx} className="aspect-square bg-surface-container-lowest rounded-sm overflow-hidden border border-white/10 relative group">
                                      <img src={img?.startsWith('/') ? `${BACKEND_URL}${img}` : img} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                                      
                                      {!isColorImg && (
                                        <button title="Remove Extra Angle" type="button" onClick={() => removeImage(img)} className="absolute inset-0 bg-error/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="material-symbols-outlined text-white text-[16px]">delete</span>
                                        </button>
                                      )}
                                      
                                      {isColorImg && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-white/10 text-white px-1 py-1 text-[7px] font-label-caps uppercase tracking-widest text-center backdrop-blur-md">Color Var.</div>
                                      )}
                                    </div>
                                  );
                                })}
                                {[...Array(Math.max(0, 4 - secondaryImages.length))].map((_, i) => (
                                  <div key={`empty-${i}`} className="aspect-square bg-surface-container-lowest/50 border border-dashed border-white/10 flex flex-col items-center justify-center text-outline/30">
                                    <span className="text-[7px] md:text-[8px] font-label-caps tracking-widest opacity-50">SLOT {secondaryImages.length + i + 1}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Upload Button */}
                      <div>
                        <button
                          type="button"
                          disabled={uploading || (productForm.images?.length || 0) >= 5}
                          onClick={() => fileInputRef.current.click()}
                          className="w-full py-4 border border-white/10 border-dashed hover:border-primary/50 text-outline hover:text-primary transition-all font-label-caps text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group bg-white/[0.02] hover:bg-white/[0.05]"
                        >
                          <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                            {uploading ? 'sync' : 'add_photo_alternate'}
                          </span>
                          {uploading ? 'Processing...' : 'Upload Extra Angles'}
                        </button>
                        <input type="file" multiple hidden ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
                        <p className="text-[9px] md:text-[10px] text-outline text-center font-label-caps tracking-widest mt-2">WEBP, PNG OR JPG (MAX 5MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Content Sidebar */}
                  <div className="md:col-span-3 bg-background relative overflow-y-auto hide-scrollbar">
                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center justify-between p-6 md:p-8 border-b border-white/5 sticky top-0 bg-background z-10 shrink-0">
                      <div>
                        <h3 className="font-display-lg text-headline-sm uppercase tracking-tight">
                          {modalMode === 'add' ? 'Curate New Model' : 'Refine Specifications'}
                        </h3>
                        <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest mt-1">
                          {modalMode === 'add' ? 'Add to digital catalog' : 'Update architectural parameters'}
                        </p>
                      </div>
                      <button type="button" onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface transition-all p-3 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">close</span>
                      </button>
                    </div>

                    {/* Form Body */}
                    <div className="p-5 md:p-10">
                      <form id="product-form" onSubmit={handleSubmit} className="space-y-10 md:space-y-12">

                        {/* Section 1: Basic Identity */}
                        <div className="space-y-6 relative">
                          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <span className="material-symbols-outlined text-primary text-[20px]">id_card</span>
                            <h4 className="font-label-caps text-[12px] uppercase tracking-[0.2em] text-on-surface">Model Identity</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="md:col-span-2 space-y-2 group">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Model Name</label>
                              <input required className="w-full bg-surface-container-lowest border border-white/10 p-4 focus:border-primary focus:bg-surface-container-low outline-none transition-all uppercase text-[14px] tracking-widest shadow-inner rounded-sm" placeholder="E.G. THE VANGUARD" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                            </div>

                            <div className="md:col-span-2 space-y-2 group">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Architectural Category</label>
                              <div className="relative">
                                <select
                                  required
                                  className="w-full bg-surface-container-lowest border border-white/10 p-4 focus:border-primary focus:bg-surface-container-low outline-none transition-all uppercase text-[12px] tracking-widest appearance-none shadow-inner rounded-sm"
                                  value={productForm.category_id}
                                  onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                                >
                                  <option value="" disabled className="bg-background">Select Framework Line</option>
                                  {(categories || []).map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-surface-container">{cat.name}</option>
                                  ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Economics */}
                        <div className="space-y-6 relative">
                          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <span className="material-symbols-outlined text-primary text-[20px]">sell</span>
                            <h4 className="font-label-caps text-[12px] uppercase tracking-[0.2em] text-on-surface">Valuation & Stock</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="space-y-2 group">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Market Valuation ({getCurrencySymbol(currency)})</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">{getCurrencySymbol(currency)}</span>
                                <input required type="number" step="0.01" min="0" className="w-full bg-surface-container-lowest border border-white/10 p-4 pl-8 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[14px] font-mono shadow-inner rounded-sm" placeholder="295.00" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                              </div>
                            </div>

                            <div className="space-y-2 group">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Available Units</label>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[18px]">inventory_2</span>
                                <input required type="number" min="0" className="w-full bg-surface-container-lowest border border-white/10 p-4 pl-10 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[14px] font-mono shadow-inner rounded-sm" placeholder="50" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Engineering */}
                        <div className="space-y-6 relative">
                          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <span className="material-symbols-outlined text-primary text-[20px]">architecture</span>
                            <h4 className="font-label-caps text-[12px] uppercase tracking-[0.2em] text-on-surface">Structural Engineering</h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            <div className="space-y-2 group">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest group-focus-within:text-primary transition-colors">Frame Silhouette</label>
                              <select required className="w-full bg-surface-container-lowest border border-white/10 p-4 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[12px] uppercase tracking-wider shadow-inner rounded-sm" value={frameStylesList.length > 0 ? (productForm.frame_style_id ?? '') : productForm.frame_style} onChange={e => {
                                if (frameStylesList.length > 0) {
                                  const id = e.target.value ? Number(e.target.value) : null;
                                  const selected = frameStylesList.find(fs => fs.id === id);
                                  setProductForm({ ...productForm, frame_style_id: id, frame_style: selected ? selected.name : '' });
                                } else {
                                  setProductForm({ ...productForm, frame_style: e.target.value });
                                }
                              }}>
                                <option value="" disabled>Select Frame Style</option>
                                {(frameStylesList.length > 0 ? frameStylesList : FRAME_STYLES.map(name => ({ id: name, name }))).map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2 group">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest group-focus-within:text-primary transition-colors">Core Material</label>
                              <select required className="w-full bg-surface-container-lowest border border-white/10 p-4 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[12px] uppercase tracking-wider shadow-inner rounded-sm" value={materialsList.length > 0 ? (productForm.material_id ?? '') : productForm.material} onChange={e => {
                                if (materialsList.length > 0) {
                                  const id = e.target.value ? Number(e.target.value) : null;
                                  const selected = materialsList.find(m => m.id === id);
                                  setProductForm({ ...productForm, material_id: id, material: selected ? selected.name : '' });
                                } else {
                                  setProductForm({ ...productForm, material: e.target.value });
                                }
                              }}>
                                <option value="" disabled>Select Material</option>
                                {(materialsList.length > 0 ? materialsList : FRAME_MATERIALS.map(name => ({ id: name, name }))).map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            </div>

                          </div>
                        </div>

                        <hr className="border-white/5 my-8" />
                          
                        <div className="flex items-center gap-3 mb-6">
                          <span className="material-symbols-outlined text-[16px] text-primary">palette</span>
                          <h4 className="font-label-caps text-[11px] uppercase tracking-[0.2em] text-on-surface">Product Variants</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Colors */}
                          <div className="space-y-4 col-span-1 md:col-span-2">
                            <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest group-focus-within:text-primary transition-colors">Color Specifications</label>
                            
                            <div className="space-y-3">
                              {(productForm.colors || []).map((color, index) => (
                                <div key={color.id || index} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-surface-container-lowest p-3 border border-white/10 rounded-sm group relative">
                                  {/* Color Picker */}
                                  <input 
                                    type="color" 
                                    value={color.hex || '#000000'} 
                                    onChange={e => {
                                      updateColor(index, 'hex', e.target.value);
                                      updateColor(index, 'name', e.target.value); // Fallback name to hex code
                                    }}
                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                                  />
                                  
                                  <div className="flex-1 min-w-[80px] text-[12px] uppercase tracking-wider font-mono text-outline">
                                    {color.hex || '#000000'}
                                  </div>

                                  {/* Image Upload/Preview */}
                                  <div className="relative w-10 h-10 rounded overflow-hidden border border-white/10 bg-surface-container flex items-center justify-center shrink-0">
                                    {color.image_url ? (
                                      <img src={color.image_url?.startsWith('/') ? `${BACKEND_URL}${color.image_url}` : color.image_url} className="w-full h-full object-cover" alt="Color variant" />
                                    ) : (
                                      <span className="material-symbols-outlined text-[16px] text-outline">image</span>
                                    )}
                                    <input 
                                      title="Upload photo for this color"
                                      type="file" 
                                      className="absolute inset-0 opacity-0 cursor-pointer" 
                                      accept="image/*" 
                                      onChange={e => handleColorImageUpload(index, e.target.files[0])}
                                    />
                                  </div>

                                  {/* Primary Radio */}
                                  <button 
                                    type="button" 
                                    onClick={() => setPrimaryColor(index)}
                                    className={`px-3 py-2 text-[9px] font-label-caps tracking-widest uppercase border rounded-sm transition-colors shrink-0 ${color.isPrimary ? 'bg-primary text-black border-primary' : 'border-white/20 text-outline hover:border-white/50 hover:text-white'}`}
                                  >
                                    {color.isPrimary ? 'Primary' : 'Set Primary'}
                                  </button>

                                  {/* Remove */}
                                  <button 
                                    type="button" 
                                    onClick={() => removeColor(index)}
                                    className="p-2 text-error/70 hover:text-error transition-colors shrink-0"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              ))}

                              <button 
                                type="button" 
                                onClick={addColor}
                                className="w-full py-3 border border-white/10 border-dashed hover:border-primary/50 text-outline hover:text-primary transition-all font-label-caps text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05]"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Color Variant
                              </button>
                            </div>
                          </div>

                          {/* Sizes */}
                          <div className="space-y-4 group col-span-1 md:col-span-2">
                            <div className="flex items-center justify-between gap-4">
                              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest group-focus-within:text-primary transition-colors">Size Variants</label>
                              <button
                                type="button"
                                onClick={addSize}
                                className="px-3 py-2 border border-white/10 rounded-sm text-[10px] uppercase tracking-[0.2em] font-label-caps text-outline hover:border-primary hover:text-primary transition-all"
                              >
                                Add Variant
                              </button>
                            </div>
                            <div className="space-y-3">
                              {(productForm.sizes || []).map((size, index) => (
                                <div key={size.id || index} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end bg-surface-container-lowest rounded-sm border border-white/10 p-3">
                                  <div className="space-y-2">
                                    <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Variant</label>
                                    <input
                                      className="w-full bg-surface-container-lowest border border-white/10 p-3 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[12px] tracking-wider rounded-sm"
                                      value={typeof size === 'string' ? size : size.label}
                                      onChange={e => updateSize(index, 'label', e.target.value)}
                                      placeholder="E.g. 48-22 / Small"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Cadre Width (mm)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      className="w-full bg-surface-container-lowest border border-white/10 p-3 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[12px] tracking-wider rounded-sm"
                                      value={size.frame_width_mm ?? ''}
                                      onChange={e => updateSize(index, 'frame_width_mm', e.target.value)}
                                      placeholder="140"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Cadre Length (mm)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      className="w-full bg-surface-container-lowest border border-white/10 p-3 focus:border-primary focus:bg-surface-container-low outline-none transition-all text-[12px] tracking-wider rounded-sm"
                                      value={size.frame_length_mm ?? ''}
                                      onChange={e => updateSize(index, 'frame_length_mm', e.target.value)}
                                      placeholder="45"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSize(index)}
                                    className="p-3 text-error/70 hover:text-error transition-colors rounded-sm"
                                  >
                                    <span className="material-symbols-outlined">delete</span>
                                  </button>
                                </div>
                              ))}
                              <p className="text-[10px] text-outline uppercase tracking-[0.2em]">Each size variant carries its own Cadre Width and Length values.</p>
                            </div>
                          </div>
                        </div>

                        <hr className="border-white/5 my-8" />

                        {/* Section 4: Narrative */}
                        <div className="space-y-6 relative pb-8">
                          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
                            <h4 className="font-label-caps text-[12px] uppercase tracking-[0.2em] text-on-surface">Design Narrative</h4>
                          </div>

                          <div className="space-y-2 group">
                            <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors">Architectural Description</label>
                            <textarea required rows="5" className="w-full bg-surface-container-lowest border border-white/10 p-5 focus:border-primary focus:bg-surface-container-low outline-none transition-all resize-none font-body-md text-[14px] leading-relaxed shadow-inner rounded-sm" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Detail the inspiration, craftsmanship, and distinctive features of this model..." />
                          </div>
                        </div>

                      </form>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer Actions (Spans full width) */}
                <div className="p-4 md:p-6 border-t border-white/10 bg-surface-container-low z-20 shrink-0 w-full sticky bottom-0 md:static">
                  <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 justify-end items-center w-full">
                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 md:py-4 bg-transparent border border-white/10 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-white/5 hover:border-white/30 transition-all text-on-surface w-full md:w-auto rounded-sm">
                      Discard
                    </button>
                    <button type="submit" form="product-form" disabled={uploading} className="px-10 py-3 md:py-4 bg-on-surface text-background font-label-caps text-[10px] tracking-[0.2em] uppercase hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto flex items-center justify-center gap-2 rounded-sm">
                      <span className="material-symbols-outlined text-[18px]">
                        {modalMode === 'add' ? 'add_circle' : 'save'}
                      </span>
                      {modalMode === 'add' ? 'Confirm Curation' : 'Save Specifications'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminProducts;
