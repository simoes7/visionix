import { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const showAlert = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const showConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      setModal({
        ...config,
        resolve: (value) => {
          setModal(null);
          resolve(value);
        },
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 right-12 z-[200] glass-panel border border-white/10 px-8 py-5 animate-in fade-in slide-in-from-right-10 duration-700 shadow-2xl backdrop-blur-3xl min-w-[300px]">
          <div className="flex items-center gap-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              toast.type === 'error' ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'check_circle'}
              </span>
            </div>
            <div>
              <p className="font-label-caps text-[11px] text-on-surface uppercase tracking-[0.2em] mb-1">
                {toast.type === 'error' ? 'SYSTEM ERROR' : 'NOTIFICATION'}
              </p>
              <p className="font-body-md text-on-surface-variant text-[13px] uppercase tracking-wide">
                {toast.message}
              </p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto opacity-30 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 h-[2px] bg-primary/30 animate-progress-shrink w-full origin-left"></div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-gutter animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => modal.resolve(false)}></div>
          <div className="relative glass-panel border border-white/10 p-12 max-w-lg w-full shadow-[0px_40px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
                <span className="material-symbols-outlined text-[40px] text-primary">help_outline</span>
              </div>
              <h3 className="font-display-lg text-headline-sm text-on-surface uppercase mb-4 tracking-tight">{modal.title || 'Are you sure?'}</h3>
              <p className="font-body-lg text-on-surface-variant/80 uppercase tracking-wide leading-relaxed">
                {modal.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => modal.resolve(false)}
                className="py-5 border border-white/10 font-label-caps text-[11px] tracking-[0.2em] uppercase hover:bg-white/5 transition-all text-on-surface/60"
              >
                {modal.cancelText || 'Cancel'}
              </button>
              <button 
                onClick={() => modal.resolve(true)}
                className="py-5 bg-on-surface text-background font-label-caps text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-all shadow-xl"
              >
                {modal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within an AlertProvider');
  return context;
};
