import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const SECTIONS = {
  home: [
    {
      title: 'Hero / Header Section',
      description: 'Curate the premium first-impression banner of the public homepage.',
      fields: [
        { key: 'hero_label', label: 'Section Tagline', type: 'text', placeholder: 'e.g. THE NEW ARCHITECTURE' },
        { key: 'hero_title', label: 'Main Display Headline', type: 'textarea', placeholder: 'e.g. Sculpted Vision for the Modern Vanguard.' },
        { key: 'hero_image', label: 'Editorial Background Image', type: 'image' },
      ]
    },
    {
      title: 'Future Vision Section',
      description: 'Curate the interactive AI Virtual Fitting section narrative.',
      fields: [
        { key: 'future_vision_label', label: 'Section Tagline', type: 'text', placeholder: 'e.g. FUTURE VISION' },
        { key: 'future_vision_title', label: 'Section Headline', type: 'text', placeholder: 'e.g. AI Mirror: Virtual Fitting Reimagined' },
        { key: 'future_vision_description', label: 'Section Copy Text', type: 'textarea', placeholder: 'Describe the virtual try-on technology...' },
        { key: 'future_vision_image', label: 'Futuristic Mirror Side Banner', type: 'image' },
      ]
    },
    {
      title: 'Editorial Testimonial Section',
      description: 'Highlight architectural or celebrity quote overlays.',
      fields: [
        { key: 'quote_text', label: 'Quote Statement', type: 'textarea', placeholder: 'Write a stunning testimonial...' },
        { key: 'quote_author', label: 'Quoted Author / Position', type: 'text', placeholder: 'e.g. MARCUS CHEN — ARCHITECTURAL LEAD' },
      ]
    }
  ],
  about: [
    {
      title: 'Hero / Header Section',
      description: 'Curate the editorial banner of the Craftsmanship and Philosophy page.',
      fields: [
        { key: 'hero_label', label: 'Section Tagline', type: 'text', placeholder: 'e.g. CRAFTING VISION' },
        { key: 'hero_title', label: 'Main Display Headline', type: 'textarea', placeholder: 'e.g. Architectural precision in every curve.' },
        { key: 'hero_image', label: 'Crafting Background Image', type: 'image' },
      ]
    },
    {
      title: 'Our Philosophy Section',
      description: 'Describe the design ethos and core optical guidelines of your brand.',
      fields: [
        { key: 'philosophy_title', label: 'Manifesto Bold Title', type: 'textarea', placeholder: 'e.g. We believe eyewear is the most intimate form of architecture...' },
        { key: 'philosophy_text_1', label: 'Ethos Paragraph 1', type: 'textarea', placeholder: 'Manifesto content segment 1...' },
        { key: 'philosophy_text_2', label: 'Ethos Paragraph 2', type: 'textarea', placeholder: 'Manifesto content segment 2...' },
      ]
    },
    {
      title: 'Sustainability Section',
      description: 'Communicate the ethical manufacturing and recyclable packaging commitment.',
      fields: [
        { key: 'sustainability_title', label: 'Sustainability Headline', type: 'text', placeholder: 'e.g. Circular by design, ethical by nature.' },
        { key: 'sustainability_image', label: 'Eco-Packaging Editorial Image', type: 'image' },
      ]
    }
  ]
};

const AdminContent = () => {
  const [activePage, setActivePage] = useState('home');
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKeys, setUploadingKeys] = useState({});
  const { showAlert } = useAlert();

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/content/${activePage}`);
      setContent(response.data || {});
    } catch (err) {
      console.error("Fetch content error:", err);
      showAlert(`Failed to load ${activePage} content.`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activePage]);

  const handleChange = (key, value) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size & format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('Unsupported file format. Use JPEG, PNG, or WEBP.', 'error');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showAlert('File size exceeds the 5MB boundary.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('images', file);

    try {
      setUploadingKeys(prev => ({ ...prev, [key]: true }));
      showAlert('Uploading premium asset to server...', 'info');
      const response = await api.post('/admin/upload', formData);
      const imageUrl = response.data?.imageUrls?.[0];
      if (imageUrl) {
        handleChange(key, imageUrl);
        showAlert('Asset successfully synchronized.', 'success');
      }
    } catch (err) {
      console.error("Asset upload failed:", err);
      showAlert('Visual sync failed.', 'error');
    } finally {
      setUploadingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/content/${activePage}`, content);
      showAlert(`${activePage.toUpperCase()} page narrative updated successfully.`, "success");
    } catch (err) {
      console.error("Sync error:", err);
      showAlert("Failed to synchronize content changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const { key, label, type, placeholder } = field;
    const value = content[key] || '';

    if (type === 'image') {
      const isUploading = uploadingKeys[key];
      return (
        <div key={key} className="space-y-3 bg-surface-container-low/40 p-5 rounded-sm border border-white/5">
          <label className="font-label-caps text-[10px] text-outline tracking-widest block uppercase">{label}</label>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="w-28 h-28 bg-surface-container border border-white/10 rounded-sm overflow-hidden flex-shrink-0 relative group">
              {value ? (
                <img src={getImageUrl(value)} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-outline uppercase tracking-wider font-label-caps">No Media</div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="flex-grow space-y-3 w-full">
              <div className="relative overflow-hidden inline-block w-full">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(key, e)}
                  disabled={isUploading}
                  id={`file-input-${key}`}
                  className="hidden"
                />
                <label 
                  htmlFor={`file-input-${key}`}
                  className="w-full sm:w-auto text-center inline-block bg-surface-container-high hover:bg-surface-container-highest border border-white/5 hover:border-white/10 text-on-surface px-6 py-3 font-label-caps text-[10px] tracking-widest uppercase cursor-pointer transition-all duration-300 rounded-sm"
                >
                  {value ? 'Change Visual' : 'Upload Visual'}
                </label>
              </div>
              <p className="text-[9px] text-outline uppercase tracking-wider">Supports JPEG, PNG, WEBP — Max 5MB</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <label className="font-label-caps text-[10px] text-outline tracking-widest block uppercase">{label}</label>
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={4}
            placeholder={placeholder}
            className="w-full bg-surface-container-low border border-white/5 hover:border-white/10 focus:border-primary rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-0 outline-none transition-all resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface-container-low border border-white/5 hover:border-white/10 focus:border-primary rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-0 outline-none transition-all"
          />
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      {/* Header and Page Tabs */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/10 pb-6">
        <div>
          <h3 className="font-display-lg text-headline-sm md:text-headline-md uppercase">Narrative & Creative Archive</h3>
          <p className="font-label-caps text-[10px] text-outline mt-1 uppercase tracking-widest">Configure visual storytelling and layout copy for top-level pages.</p>
        </div>
        <div className="flex gap-2 bg-surface-container-low p-1 rounded-sm border border-white/5">
          {[
            { id: 'home', label: 'Home Page' },
            { id: 'about', label: 'About / Ethos' }
          ].map(page => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`px-6 py-2.5 font-label-caps text-[10px] tracking-widest uppercase transition-all duration-500 rounded-sm ${activePage === page.id ? 'bg-on-surface text-background font-bold shadow-md' : 'text-on-surface/50 hover:text-on-surface'}`}
            >
              {page.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {loading ? (
          <div className="glass-card py-32 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Synchronizing Creative Assets...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {SECTIONS[activePage].map((section, idx) => (
              <div key={idx} className="glass-card p-6 md:p-10 space-y-8 border border-white/5 hover:border-white/10 transition-all duration-500">
                <div>
                  <h4 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">{section.title}</h4>
                  <p className="text-[11px] text-on-surface-variant/80 mt-1">{section.description}</p>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {section.fields.map(field => renderField(field))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={saving || loading}
            className="w-full md:w-auto bg-on-surface text-background px-16 py-5 font-label-caps text-label-caps tracking-[0.2em] hover:bg-primary hover:text-white transition-all duration-500 disabled:opacity-50 uppercase rounded-sm cursor-pointer shadow-lg"
          >
            {saving ? 'Synchronizing...' : `Commit ${activePage} Narrative`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminContent;
