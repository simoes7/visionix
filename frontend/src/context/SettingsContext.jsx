import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

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
    maintenance_mode: false,
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

  const refreshSettings = () => fetchSettings();

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
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
