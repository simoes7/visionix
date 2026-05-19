import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';

const BACKEND_URL = (api.defaults.baseURL || '').replace('/api', '');

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const Footer = () => {
  const { settings } = useSettings();

  return (
    <footer className="bg-surface dark:bg-surface-container-lowest border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter px-gutter py-24 max-w-container-max mx-auto">
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {settings.logo_type === 'image' && settings.site_logo_url ? (
                <img src={getImageUrl(settings.site_logo_url)} alt={settings.site_name || 'Logo'} className="h-10 object-contain brightness-0 invert" />
              ) : (
                <h2 className="font-display-lg text-headline-md text-on-surface uppercase tracking-tighter">{settings.site_name}</h2>
              )}
            </div>
            {settings.site_tagline && (
              <p className="text-primary font-label-caps text-[11px] tracking-[0.2em] uppercase max-w-xs leading-relaxed">
                {settings.site_tagline}
              </p>
            )}
            <p className="text-on-surface-variant font-body-md text-[13px] max-w-xs leading-relaxed opacity-80">
              {settings.footer_text || 'Architectural minimalism in optics. Designing the future of sight through the lens of pure geometry.'}
            </p>
          </div>
          
          <div className="flex gap-4 pt-4">
            {settings.social_instagram && (
              <a className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-primary hover:text-primary transition-all duration-500 rounded-sm group" href={settings.social_instagram} target="_blank" rel="noopener noreferrer">
                <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.247 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.061 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.247-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.061-2.633-.333-3.608-1.308-.975-.975-1.247-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.247 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.947.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c.796 0 1.441.645 1.441 1.44s-.645 1.441-1.441 1.441-1.44-0.645-1.44-1.441c0-0.795.645-1.44 1.44-1.44z"/>
                </svg>
              </a>
            )}
            {settings.social_twitter && (
              <a className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-primary hover:text-primary transition-all duration-500 rounded-sm group" href={settings.social_twitter} target="_blank" rel="noopener noreferrer">
                <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Collections Column */}
        <div className="md:col-span-2">
          <h4 className="font-label-caps text-label-caps text-on-surface mb-8">COLLECTIONS</h4>
          <ul className="space-y-4">
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/shop?category=optical">Optical</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/shop?category=sunglasses">Sunglasses</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/shop?category=accessoires">Accessoires</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/shop">Collections</Link></li>
          </ul>
        </div>

        {/* Philosophy Column */}
        <div className="md:col-span-2">
          <h4 className="font-label-caps text-label-caps text-on-surface mb-8">PHILOSOPHY</h4>
          <ul className="space-y-4">
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/about">About Us</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/about">Craftsmanship</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/about">Sustainability</Link></li>
          </ul>
        </div>

        {/* Client Service Column */}
        <div className="md:col-span-2">
          <h4 className="font-label-caps text-label-caps text-on-surface mb-8">SERVICE</h4>
          <ul className="space-y-4">
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/shipping">Shipping</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/returns">Returns</Link></li>
            <li><Link className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" to="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Contact Column (NEW) */}
        <div className="md:col-span-2">
          <h4 className="font-label-caps text-label-caps text-on-surface mb-8">ENQUIRIES</h4>
          <ul className="space-y-4">
            {settings.site_email && (
              <li>
                <a className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider break-all" href={`mailto:${settings.site_email}`}>
                  {settings.site_email}
                </a>
              </li>
            )}
            {settings.contact_phone && (
              <li>
                <a className="font-body-md text-[13px] text-on-surface-variant hover:text-on-surface hover:underline decoration-1 underline-offset-4 transition-colors uppercase tracking-wider" href={`tel:${settings.contact_phone}`}>
                  {settings.contact_phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-8">
        <div className="px-gutter max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body-md text-body-md text-on-surface-variant/60">© {new Date().getFullYear()} {settings.site_name}. ARCHITECTURAL MINIMALISM IN OPTICS.</p>
          <div className="flex gap-8">
            <Link className="font-label-caps text-[10px] text-on-surface-variant/40 hover:text-on-surface transition-colors" to="/privacy">PRIVACY POLICY</Link>
            <Link className="font-label-caps text-[10px] text-on-surface-variant/40 hover:text-on-surface transition-colors" to="/terms">TERMS OF SERVICE</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
