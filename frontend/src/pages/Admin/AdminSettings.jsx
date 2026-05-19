import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { useSettings } from '../../context/SettingsContext';

const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const AdminSettings = () => {
  const { showAlert } = useAlert();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({
    site_name: '',
    site_tagline: '',
    footer_text: '',
    site_email: '',
    currency: '',
    contact_phone: '',
    whatsapp_number: '',
    contact_address: '',
    tax_rate: '0.00',
    low_stock_threshold: 10,
    enable_reviews: true,
    enable_wishlist: true,
    social_instagram: '',
    social_twitter: '',
    logo_type: 'text',
    site_logo_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        if (response.data) {
          setSettings(prev => ({ ...prev, ...response.data }));
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        showAlert("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation to match backend limits and provide instant feedback
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showAlert('Unsupported file format. Use JPEG, PNG, or WEBP.', 'error');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB - must match backend limit
    if (file.size > maxSize) {
      showAlert('File too large. Maximum allowed size is 5MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('images', file);

    try {
      setLogoUploading(true);
      // Let axios set the Content-Type (including boundary). Manually setting it can break multipart uploads.
      const response = await api.post('/admin/upload', formData);

      const imageUrl = response.data?.imageUrls?.[0];
      if (imageUrl) {
        setSettings(prev => ({ ...prev, site_logo_url: imageUrl, logo_type: 'image' }));
        showAlert('Logo uploaded successfully.', 'success');
      } else {
        console.error('Unexpected upload response:', response);
        showAlert('Upload completed but no image URL returned.', 'warning');
      }
    } catch (err) {
      console.error('Logo upload failed:', err?.response?.data || err);
      showAlert(err?.response?.data?.message || 'Logo upload failed.', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoTypeChange = (value) => {
    setSettings(prev => ({ ...prev, logo_type: value }));
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logo_type: 'text', site_logo_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings', settings);
      await refreshSettings();
      showAlert("Settings updated successfully", "success");
    } catch (err) {
      console.error("Failed to update settings:", err);
      showAlert("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-gutter text-center uppercase font-label-caps opacity-50">Loading Settings...</div>;

  return (
    <div className="animate-in fade-in duration-700">
      <div className="mb-10">
        <h3 className="font-display-lg text-headline-sm md:text-headline-md uppercase">Global Configurations</h3>
        <p className="font-label-caps text-[10px] text-outline mt-1 uppercase tracking-widest">Manage your platform's core identity and contact parameters.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* General Settings */}
        <div className="glass-card p-6 md:p-8 space-y-8">
          <h4 className="font-label-caps text-label-caps text-primary uppercase tracking-widest border-b border-white/5 pb-4">General Information</h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Logo Display</label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 p-3 border rounded-sm cursor-pointer bg-surface-container-lowest">
                  <input
                    type="radio"
                    name="logo_type"
                    value="text"
                    checked={settings.logo_type === 'text'}
                    onChange={() => handleLogoTypeChange('text')}
                    className="accent-primary"
                  />
                  <span className="text-[13px]">Text</span>
                </label>
                <label className="inline-flex items-center gap-2 p-3 border rounded-sm cursor-pointer bg-surface-container-lowest">
                  <input
                    type="radio"
                    name="logo_type"
                    value="image"
                    checked={settings.logo_type === 'image'}
                    onChange={() => handleLogoTypeChange('image')}
                    className="accent-primary"
                  />
                  <span className="text-[13px]">Image</span>
                </label>
              </div>
            </div>

            {settings.logo_type === 'image' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Upload Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                {settings.site_logo_url && (
                  <div className="space-y-3">
                    <div className="text-[10px] text-outline uppercase tracking-widest">Logo Preview</div>
                    <div className="flex items-center gap-4">
                      <img src={getImageUrl(settings.site_logo_url)} alt="Logo preview" className="h-14 object-contain rounded-sm border border-white/10 bg-surface-container-low" />
                      <button type="button" onClick={handleRemoveLogo} className="px-4 py-2 border border-error/30 text-error uppercase text-[10px] tracking-[0.2em] rounded-sm hover:bg-error/10 transition-all">Remove</button>
                    </div>
                  </div>
                )}
                {logoUploading && <div className="text-[12px] text-primary">Uploading logo…</div>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] text-outline uppercase tracking-widest">Text logo uses the site name above.</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Site Name</label>
              <input 
                name="site_name"
                value={settings.site_name || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="text" 
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Site Tagline</label>
              <input 
                name="site_tagline"
                value={settings.site_tagline || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="text" 
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Footer Text</label>
              <textarea
                name="footer_text"
                value={settings.footer_text || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Primary Currency</label>
              <select 
                name="currency"
                value={settings.currency || 'USD'}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="MAD">MAD (د.م)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="glass-card p-6 md:p-8 space-y-8">
          <h4 className="font-label-caps text-label-caps text-tertiary uppercase tracking-widest border-b border-white/5 pb-4">Contact & Support</h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Support Email</label>
              <input 
                name="site_email"
                value={settings.site_email || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="email" 
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Contact Phone</label>
              <input 
                name="contact_phone"
                value={settings.contact_phone || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="text" 
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">WhatsApp Number</label>
              <input 
                name="whatsapp_number"
                value={settings.whatsapp_number || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="text" 
                placeholder="2126XXXXXXXX"
              />
              <p className="text-[9px] text-outline uppercase">e.g., 212612345678</p>
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Contact Address</label>
              <textarea
                name="contact_address"
                value={settings.contact_address || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Social Presence */}
        <div className="glass-card p-6 md:p-8 lg:col-span-2 space-y-8">
          <h4 className="font-label-caps text-label-caps text-outline uppercase tracking-widest border-b border-white/5 pb-4">Social Media Channels</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Instagram URL</label>
              <input 
                name="social_instagram"
                value={settings.social_instagram || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="text" 
              />
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-outline uppercase tracking-widest block">Twitter / X URL</label>
              <input 
                name="social_twitter"
                value={settings.social_twitter || ''}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-none rounded-sm px-4 py-3 text-[13px] font-body-md focus:ring-1 focus:ring-primary outline-none transition-all" 
                type="text" 
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end pt-4">
          <button 
            type="submit"
            disabled={saving}
            className="w-full md:w-auto bg-on-surface text-background px-12 py-4 font-label-caps text-label-caps tracking-[0.2em] hover:bg-primary transition-all duration-500 disabled:opacity-50 uppercase"
          >
            {saving ? 'Synchronizing...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
