import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../utils/currency';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const { showAlert } = useAlert();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Backend admin endpoint for all orders is /admin/orders or similar? 
      // Let's check routes.
      const response = await api.get('/admin/orders').catch(() => api.get('/orders')); 
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      showAlert("Failed to retrieve order history.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      showAlert(`Order #VNX-${id} marked as ${status}.`);
      fetchOrders();
    } catch (err) {
      showAlert("Failed to update status.", "error");
    }
  };

  return (
    <div className="space-y-gutter animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h2 className="font-display-lg text-headline-sm md:text-headline-md uppercase">Order Management</h2>
        <p className="font-label-caps text-outline text-[10px] mt-1 uppercase tracking-widest">Fulfillment & Purchase Analytics</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="font-label-caps text-[10px] text-outline tracking-widest border-b border-white/5">
                <th className="px-8 py-4 font-semibold uppercase">Order ID</th>
                <th className="px-8 py-4 font-semibold uppercase">Customer</th>
                <th className="px-8 py-4 font-semibold uppercase">Date</th>
                <th className="px-8 py-4 font-semibold uppercase">Total</th>
                <th className="px-8 py-4 font-semibold uppercase">Status</th>
                <th className="px-8 py-4 font-semibold uppercase text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-label-caps text-[11px]">
              {(orders || []).map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">#VNX-{o.id}</td>
                  <td className="px-8 py-5 uppercase">{o.customer_name || 'Anonymous'}</td>
                  <td className="px-8 py-5 text-outline">
                    {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A'}
                  </td>
                  <td className="px-8 py-5 font-semibold">{formatCurrency(o.total_amount, currency)}</td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase ${
                      o.status === 'delivered' ? 'border-primary/30 text-primary bg-primary/5' : 
                      o.status === 'processing' ? 'border-tertiary/30 text-tertiary bg-tertiary/5' : 
                      o.status === 'shipped' ? 'border-white/20 text-on-surface bg-white/5' : 'border-outline/30 text-outline'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <select 
                      className="bg-transparent border border-white/10 rounded-sm text-[10px] font-label-caps p-1 outline-none focus:border-primary transition-colors cursor-pointer"
                      value={o.status}
                      onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                    >
                      <option value="pending" className="bg-background">Pending</option>
                      <option value="processing" className="bg-background">Processing</option>
                      <option value="shipped" className="bg-background">Shipped</option>
                      <option value="delivered" className="bg-background">Delivered</option>
                      <option value="cancelled" className="bg-background">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {(orders || []).map((o) => (
          <div key={o.id} className="glass-card p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Order Reference</p>
                <h4 className="font-display-lg text-headline-sm uppercase">#VNX-{o.id}</h4>
              </div>
              <span className={`px-3 py-1 rounded-full border text-[8px] uppercase tracking-widest ${
                o.status === 'delivered' ? 'border-primary/30 text-primary bg-primary/5' : 
                o.status === 'processing' ? 'border-tertiary/30 text-tertiary bg-tertiary/5' : 
                o.status === 'shipped' ? 'border-white/20 text-on-surface bg-white/5' : 'border-outline/30 text-outline'
              }`}>
                {o.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Customer</p>
                <p className="font-label-caps text-[11px] mt-1 uppercase truncate">{o.customer_name || 'Anonymous'}</p>
              </div>
              <div>
                <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Amount</p>
                <p className="font-headline-sm text-tertiary mt-0.5">{formatCurrency(o.total_amount, currency)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <label className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Update Fulfillment Status</label>
              <select 
                className="w-full bg-surface-container-low border border-white/10 rounded-sm text-[10px] font-label-caps p-3 outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
                value={o.status}
                onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
              >
                <option value="pending" className="bg-background">Pending</option>
                <option value="processing" className="bg-background">Processing</option>
                <option value="shipped" className="bg-background">Shipped</option>
                <option value="delivered" className="bg-background">Delivered</option>
                <option value="cancelled" className="bg-background">Cancelled</option>
              </select>
            </div>
            
            <p className="text-[9px] text-outline uppercase tracking-widest text-center pt-2">
              Log Recorded: {o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        ))}
      </div>

      {(orders || []).length === 0 && !loading && (
        <div className="glass-card py-20 text-center text-outline uppercase text-[10px] tracking-widest">
          No orders recorded in the system.
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
