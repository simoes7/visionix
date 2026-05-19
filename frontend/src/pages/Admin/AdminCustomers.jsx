import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const { showAlert, showConfirm } = useAlert();
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    role: 'customer',
    password: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Fetch customers error:", err);
      showAlert("Failed to synchronize customer registry.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Body scroll lock when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);

  const openAddModal = () => {
    setModalMode('add');
    setCustomerForm({ 
      name: '', 
      email: '', 
      role: 'customer', 
      password: '' 
    });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setModalMode('edit');
    setCustomerForm({ 
      ...customer, 
      password: '' 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        if (!customerForm.password) {
          showAlert("Security credential required for new account.", "info");
          return;
        }
        await api.post('/admin/users', customerForm);
        showAlert(`${customerForm.name} added to the architectural registry.`);
      } else {
        await api.put(`/admin/users/${customerForm.id}`, customerForm);
        showAlert(`Credentials for ${customerForm.name} updated.`);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      showAlert("Operation failed: synchronization error", "error");
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm({
      title: 'Revoke Access?',
      message: `Are you sure you want to decommission ${name}'s account? This action is irreversible.`,
      confirmText: 'Revoke',
      cancelText: 'Preserve'
    });

    if (confirmed) {
      try {
        await api.delete(`/admin/users/${id}`);
        showAlert(`${name} has been removed from the registry.`);
        fetchCustomers();
      } catch (err) {
        showAlert("Revocation failed.", "error");
      }
    }
  };

  return (
    <div className="space-y-gutter animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="font-display-lg text-headline-sm md:text-headline-md uppercase">Customer Registry</h2>
          <p className="font-label-caps text-outline text-[10px] mt-1 uppercase tracking-widest">Client Control & Engagement Oversight</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full md:w-auto px-8 py-3 bg-on-surface text-background font-label-caps text-[10px] tracking-widest hover:opacity-90 transition-all uppercase"
        >
          Enroll New Customer
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-label-caps text-[10px] text-outline tracking-widest border-b border-white/5">
                <th className="px-8 py-4 font-semibold uppercase">Subject</th>
                <th className="px-8 py-4 font-semibold uppercase">Identification</th>
                <th className="px-8 py-4 font-semibold uppercase text-center">Enrollment Date</th>
                <th className="px-8 py-4 font-semibold uppercase text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-label-caps text-[11px]">
              {(customers || []).map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center border border-white/5">
                        <span className="material-symbols-outlined text-outline text-[20px]">person</span>
                      </div>
                      <span className="uppercase tracking-wide font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-outline tracking-wider">{u.email}</td>
                  <td className="px-8 py-5 text-center text-outline">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A'}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-6 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditModal(u)} className="text-outline hover:text-on-surface underline decoration-1 underline-offset-8 uppercase transition-all">Modify</button>
                      <button onClick={() => handleDelete(u.id, u.name)} className="text-error/40 hover:text-error underline decoration-1 underline-offset-8 uppercase transition-all">Revoke</button>
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
        {(customers || []).map((u) => (
          <div key={u.id} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center border border-white/5 flex-shrink-0">
                <span className="material-symbols-outlined text-outline text-[24px]">person</span>
              </div>
              <div className="min-w-0">
                <h4 className="font-display-lg text-headline-sm uppercase truncate">{u.name}</h4>
                <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest truncate">{u.email}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <div>
                <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Enrollment</p>
                <p className="font-label-caps text-[11px] mt-1 text-on-surface">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'}
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => openEditModal(u)}
                  className="font-label-caps text-[10px] text-on-surface/60 hover:text-on-surface underline decoration-1 underline-offset-4 uppercase transition-all"
                >
                  Modify
                </button>
                <button 
                  onClick={() => handleDelete(u.id, u.name)}
                  className="font-label-caps text-[10px] text-error/60 hover:text-error underline decoration-1 underline-offset-4 uppercase transition-all"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(customers || []).length === 0 && !loading && (
        <div className="glass-card py-20 text-center text-outline uppercase tracking-[0.3em] text-[10px]">
          No subjects found in the active registry.
        </div>
      )}

      {/* Modal Interface */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-gutter transition-all duration-500 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-[24px] animate-in fade-in duration-500" 
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative glass-panel border-white/10 w-full h-full md:h-auto md:max-h-[90vh] max-w-xl flex flex-col shadow-[0px_0px_100px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 md:zoom-in-95 duration-500 overflow-hidden md:rounded-sm">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10 shrink-0 bg-surface/50 backdrop-blur-md z-10">
              <h3 className="font-display-lg text-headline-sm uppercase tracking-tight">
                {modalMode === 'add' ? 'Enroll New Subject' : 'Modify Credentials'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface transition-all p-2">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 hide-scrollbar overscroll-contain">
              <form id="customer-form" onSubmit={handleSubmit} className="space-y-6 md:space-y-8 pb-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em]">Full Name</label>
                  <input required className="w-full bg-transparent border-b border-white/10 py-3 focus:border-primary outline-none transition-colors uppercase text-[14px] tracking-widest" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em]">Email Identification</label>
                  <input required type="email" className="w-full bg-transparent border-b border-white/10 py-3 focus:border-primary outline-none transition-colors text-[14px] tracking-widest" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-outline uppercase tracking-[0.2em]">
                    {modalMode === 'add' ? 'Security Password' : 'New Password (Optional)'}
                  </label>
                  <input 
                    type="password" 
                    placeholder={modalMode === 'edit' ? "LEAVE BLANK TO RETAIN" : "••••••••"}
                    className="w-full bg-transparent border-b border-white/10 py-3 focus:border-primary outline-none transition-colors text-[14px]" 
                    value={customerForm.password} 
                    onChange={e => setCustomerForm({...customerForm, password: e.target.value})} 
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer Actions */}
            <div className="p-6 md:p-8 border-t border-white/10 bg-surface/80 backdrop-blur-xl shrink-0 z-10">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border border-white/10 font-label-caps text-[10px] tracking-[0.2em] uppercase hover:bg-white/5 transition-all text-on-surface">Discard Changes</button>
                <button type="submit" form="customer-form" className="flex-1 py-4 bg-on-surface text-background font-label-caps text-[10px] tracking-[0.2em] uppercase hover:opacity-90 transition-all shadow-xl">
                  {modalMode === 'add' ? 'Confirm Enrollment' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
