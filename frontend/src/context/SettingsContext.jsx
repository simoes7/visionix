import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site_name: 'VISIONIX',
    site_tagline: 'Architectural minimalism in optics.',
    footer_text: 'Designing the future of sight through the lens of pure geometry.',
    site_email: '',
    contact_phone: '',
    whatsapp_number: '',
    contact_address: '',
    currency: 'USD',
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

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Sync document title and favicon with site settings
  useEffect(() => {
    if (!settings) return;
    const titleParts = [];
    if (settings.site_name) titleParts.push(settings.site_name);
    if (settings.site_tagline) titleParts.push(settings.site_tagline);
    if (titleParts.length > 0) document.title = titleParts.join(' | ');

    const setFavicon = (href) => {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = href || '/favicon.svg';
    };

    if (settings.logo_type === 'image' && settings.site_logo_url) {
      setFavicon(getImageUrl(settings.site_logo_url));
    } else {
      setFavicon('/favicon.svg');
    }
  }, [settings]);

  const refreshSettings = () => fetchSettings();

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, getImageUrl }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};

export default SettingsContext;
