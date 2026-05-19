import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { showAlert } = useAlert();
  const { settings, getImageUrl } = useSettings();
  const navigate = useNavigate();

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setIsSubmitting(true);
      const userData = await loginWithGoogle(response.credential);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        showAlert(`Welcome, ${userData.name}`);
        navigate('/');
      }
    } catch (err) {
      console.error("Google login failed:", err);
      showAlert(err.response?.data?.message || 'Google authentication failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId);

    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '993342347692-p1rmgl10r4s2alrer892c7b08lfkr2bc.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
        });

        const btnContainer = document.getElementById("google-signin-btn");
        if (btnContainer) {
          window.google.accounts.id.renderButton(
            btnContainer,
            { 
              theme: "outline", 
              size: "large", 
              width: "100%", 
              type: "standard",
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "center"
            }
          );
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const userData = await login(email, password);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        showAlert(`Welcome back, ${userData.name}`);
        navigate('/');
      }
    } catch (err) {
      console.error("Login failed:", err);
      showAlert(err.response?.data?.message || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary selection:text-on-primary">
      <main className="min-h-screen flex overflow-hidden">
        {/* Brand Identity Fixed Anchor */}
        <div className="fixed top-8 left-8 z-50">
          <Link to="/" className="group block">
            {settings.logo_type === 'image' && settings.site_logo_url ? (
              <img src={getImageUrl(settings.site_logo_url)} alt={settings.site_name || 'Logo'} className="h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <span className="font-display-lg text-headline-sm tracking-tighter text-on-surface uppercase group-hover:text-primary transition-colors">{settings.site_name}</span>
            )}
          </Link>
        </div>

        {/* Left Column: Split Screen Visual */}
        <div className="hidden md:block md:w-1/2 relative bg-surface-container-lowest">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-60"></div>
          <img 
            alt="High-fashion eyewear portrait" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkXAL2X_6VCY7upYzJG8VHCj3hxb62XCz7OAWyDHE7jm71hDrfYEI_4XC0tFCFpAE7rbpDkAs2Rg-RjQ2c4eLC38mgajb8qSPRiIduq7_rn8kFcHV3RFnkcAsim-ONZ9XKItD6oe-oo2zGSXmxkBmh9h5Rt-IiXEPm-JnF7sx8KzfO0RGI9bAsABhEPYvONBgV0FxFChygavKo4TamoH9SZftPFat3FIdAyHchEOaUnIPPZb0fKL5kgzYZbWtmm2H-Ba1iJRNebQ-9" 
          />
          {/* Contextual Branding Text */}
          <div className="absolute bottom-16 left-16 z-20 max-w-md">
            <p className="font-label-caps text-label-caps text-on-surface/50 mb-4 uppercase tracking-[0.3em]">ESTABLISHED 2024</p>
            <h2 className="font-headline-md text-headline-md text-on-surface leading-tight uppercase">THE ART OF ARCHITECTURAL OPTICS.</h2>
          </div>
        </div>

        {/* Right Column: Form Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-gutter relative">
          <Link 
            to="/shop" 
            className="absolute top-8 right-8 flex items-center gap-2 font-label-caps text-label-caps text-on-surface/60 hover:text-on-surface transition-colors duration-300"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>BACK TO SHOP</span>
          </Link>

          <div className="w-full max-w-md space-y-10">
            <header className="text-center md:text-left space-y-2">
              <h3 className="font-display-lg text-headline-md text-on-surface uppercase">Welcome Back</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Sign in to access your bespoke collections and order history.</p>
            </header>

            <div className="glass-panel hairline-border p-8 md:p-10 rounded-lg shadow-[0px_20px_40px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-surface/60 block" htmlFor="email">EMAIL ADDRESS</label>
                  <input 
                    className="w-full bg-transparent border-0 border-b border-white/10 py-3 px-0 text-on-surface font-body-md focus:ring-0 focus:border-on-surface transition-colors duration-300 placeholder:text-on-surface/20 outline-none" 
                    id="email" 
                    type="email" 
                    placeholder={`name@${settings.site_name?.toLowerCase().replace(/\s+/g, '') || 'visionix'}.com`} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-caps text-label-caps text-on-surface/60" htmlFor="password">PASSWORD</label>
                    <button type="button" className="font-label-caps text-label-caps text-primary/80 hover:text-on-surface transition-colors">FORGOT?</button>
                  </div>
                  <input 
                    className="w-full bg-transparent border-0 border-b border-white/10 py-3 px-0 text-on-surface font-body-md focus:ring-0 focus:border-on-surface transition-colors duration-300 placeholder:text-on-surface/20 outline-none" 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <button 
                  className="w-full py-5 bg-on-surface text-background font-label-caps text-label-caps tracking-[0.2em] hover:opacity-80 transition-all duration-300 active:scale-[0.98] disabled:opacity-50" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-label-caps">
                  <span className="bg-surface-container-high px-4 text-on-surface/40">OR CONTINUE WITH</span>
                </div>
              </div>

              <div className="flex justify-center">
                <div id="google-signin-btn" className="w-full flex justify-center min-h-[46px]"></div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="font-body-md text-on-surface-variant">
                New to {settings.site_name}? 
                <Link to="/register" className="text-on-surface font-semibold ml-2 relative hover-underline inline-block">CREATE ACCOUNT</Link>
              </p>
              <p className="font-label-caps text-[10px] text-on-surface/30 tracking-widest uppercase">
                Architectural Minimalism in Optics. Since 2024.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-white/10">
        <div className="max-w-container-max mx-auto px-gutter py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            {settings.logo_type === 'image' && settings.site_logo_url ? (
              <img src={getImageUrl(settings.site_logo_url)} alt={settings.site_name || 'Logo'} className="h-8 object-contain brightness-0 invert opacity-45 hover:opacity-100 transition-opacity" />
            ) : (
              <div className="font-display-lg text-headline-sm text-on-surface opacity-30 uppercase tracking-tighter">{settings.site_name}</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface transition-colors uppercase" to="/shop">Collections</Link>
            <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface transition-colors uppercase" to="/craftsmanship">Craftsmanship</Link>
            <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface transition-colors uppercase" to="/sustainability">Sustainability</Link>
            <Link className="font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface transition-colors uppercase" to="/shipping">Shipping</Link>
          </div>
          <p className="font-body-md text-[12px] text-on-surface-variant/40">© 2024 {settings.site_name}. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
