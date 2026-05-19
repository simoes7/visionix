import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminCustomers from './AdminCustomers';
import AdminSettings from './AdminSettings';
import AdminContent from './AdminContent';

const Dashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const { showAlert } = useAlert();
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [selectedRange, setSelectedRange] = useState('1M');
  
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setMonth(defaultStart.getMonth() - 1);

  // Date Filter State (Default to last 1 month)
  const [dateRange, setDateRange] = useState({
    start: defaultStart.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const params = { startDate: dateRange.start, endDate: dateRange.end };
        const [statsRes, productsRes, ordersRes, stockRes] = await Promise.all([
          api.get('/admin/stats', { params }),
          api.get('/admin/top-products', { params }),
          api.get('/admin/recent-orders', { params }),
          api.get('/admin/low-stock')
        ]);
        setStats(statsRes.data);
        setChartData(statsRes.data.history || []);
        setTopProducts(productsRes.data);
        setRecentOrders(ordersRes.data);
        setLowStockProducts(stockRes.data);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        showAlert("Failed to synchronize analytics.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab, dateRange]);

  const chartPath = React.useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return 'M0,180 L1000,180';
    }

    const maxRevenue = Math.max(...chartData.map((point) => point.revenue), 1);
    const points = chartData.map((point, index) => {
      const x = chartData.length === 1 ? 0 : (index * 1000) / (chartData.length - 1);
      const y = 180 - (point.revenue / maxRevenue) * 150;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return points.join(' ');
  }, [chartData]);

  const chartAreaPath = chartData.length > 0
    ? `${chartPath} L1000,200 L0,200 Z`
    : 'M0,200 L1000,200 Z';

  const chartLabels = chartData.map((point) => new Date(point.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  }));

  const MetricCard = ({ title, value, growth, icon, chartPath, colorClass = 'text-tertiary' }) => (
    <div className="glass-card p-4 md:p-6 flex flex-col justify-between h-32 md:h-40 group hover:border-white/20 transition-all duration-500">
      <div>
        <p className="font-label-caps text-[9px] md:text-[10px] text-outline uppercase tracking-widest">{title}</p>
        <h3 className="font-display-lg text-headline-sm md:text-headline-md mt-1 group-hover:scale-[1.02] transition-transform origin-left">{value}</h3>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-[9px] md:text-[10px] font-label-caps ${growth >= 0 ? colorClass : 'text-error'} flex items-center gap-1`}>
          <span className="material-symbols-outlined text-[12px] md:text-[14px]">
            {growth >= 0 ? 'trending_up' : 'trending_down'}
          </span> 
          {growth >= 0 ? '+' : ''}{growth}%
        </span>
        <svg className="w-16 md:w-24 h-8 md:h-10 overflow-visible" viewBox="0 0 100 40">
          <path 
            className={`${growth >= 0 ? colorClass : 'text-error'} opacity-50 chart-gradient-line`} 
            d={chartPath} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
          ></path>
        </svg>
      </div>
    </div>
  );

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'products', label: 'Products', icon: 'inventory_2' },
    { id: 'orders', label: 'Orders', icon: 'shopping_cart' },
    { id: 'customers', label: 'Customers', icon: 'person' },
    { id: 'content', label: 'Page Content', icon: 'auto_stories' },
    { id: 'reviews', label: 'Reviews', icon: 'rate_review' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-md selection:bg-primary/30 transition-colors duration-700">
      {/* Mobile Navigation (Scrollable Tabs) - Aligned with Profile Style */}
      <div className="md:hidden overflow-x-auto hide-scrollbar border-b border-white/5 sticky top-0 bg-background z-[100] px-gutter">
        <div className="flex gap-8 py-4 w-max items-center">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex items-center gap-2 transition-all duration-300 whitespace-nowrap ${
                activeTab === link.id 
                  ? 'text-primary' 
                  : 'text-on-surface/40'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
              <span className="font-label-caps text-[10px] tracking-widest uppercase">{link.label}</span>
              {activeTab === link.id && (
                <div className="h-1 w-1 bg-primary rounded-full ml-1 animate-in zoom-in duration-300"></div>
              )}
            </button>
          ))}
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-error/60 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="font-label-caps text-[10px] tracking-widest uppercase">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Navigation - Aligned with Profile Style */}
      <aside className="w-72 bg-background border-r border-white/5 hidden md:flex flex-col sticky top-0 h-screen flex-shrink-0">
        <div className="p-12 pb-16">
          <span className="font-display-lg text-headline-sm tracking-tighter text-on-surface">{settings.site_name}</span>
          <p className="font-label-caps text-[10px] text-primary mt-2 uppercase tracking-[0.3em]">Administrator</p>
        </div>
        
        <nav className="flex-1 px-12 space-y-10">
          <div className="space-y-4">
            <h3 className="font-label-caps text-on-surface-variant opacity-50 uppercase tracking-widest text-[10px]">Management</h3>
            <div className="flex flex-col gap-4">
              {navLinks.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 transition-all duration-300 group ${
                    activeTab === item.id 
                    ? 'text-on-surface border-b border-on-surface pb-1 w-fit' 
                    : 'text-on-surface/60 hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-label-caps text-label-caps">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-label-caps text-on-surface-variant opacity-50 uppercase tracking-widest text-[10px]">System</h3>
            <div className="flex flex-col gap-4">
              {navLinks.slice(4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 transition-all duration-300 group ${
                    activeTab === item.id 
                    ? 'text-on-surface border-b border-on-surface pb-1 w-fit' 
                    : 'text-on-surface/60 hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="font-label-caps text-label-caps">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button 
              onClick={logout}
              className="font-label-caps text-label-caps text-error/80 hover:text-error transition-colors uppercase tracking-widest text-[12px]"
            >
              Sign Out
            </button>
          </div>
        </nav>

        <div className="p-12 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-white/10">
              <img 
                alt="Admin" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACTAcuBTAvC092N1SjocQqsIHgvYD9WhQNy6l194gxoNXBJxCV4Trch_jrSV2LfAakIREDwyU7P8ch5CuhTIWicr-7cdyFDCfJyntRD4Eveq4pkNFfRad0jy8v0oQ2ckAE9yoQqcJVyslygaHx41__YVEQWKFJv2hxTQ1772VN6GLILRW7Ju_QfmloEo3aAKmeglzuQfotMORdHhyxui2TU_UpjAEuaEmIx6PewXo2zQGyESj5f6j-FkN4Sf_WYsVitIJs9stPPXt3"
              />
            </div>
            <div className="min-w-0">
              <p className="font-label-caps text-[11px] text-on-surface truncate uppercase tracking-wider">{user?.name || 'Admin'}</p>
              <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-tighter">Chief Curator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="h-20 hidden md:flex items-center justify-between px-gutter border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 font-label-caps text-[11px] tracking-widest text-outline">
              <span className="hover:text-on-surface cursor-pointer">ADMIN</span>
              <span className="text-white/20">/</span>
              <span className="text-on-surface uppercase">{activeTab}</span>
            </nav>
          </div>
          <div className="flex items-center gap-gutter">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input 
                className="bg-surface-container-low border-none rounded-sm pl-10 pr-4 py-2 text-[11px] font-label-caps tracking-widest focus:ring-1 focus:ring-primary w-64 transition-all duration-300 outline-none" 
                placeholder="SEARCH ANALYTICS..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 text-outline hover:text-on-surface transition-colors flex items-center gap-2 group"
              >
                <span className="material-symbols-outlined text-[20px] transition-transform duration-500 group-hover:rotate-180">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <button 
                onClick={logout}
                className="p-2 text-outline hover:text-error transition-colors"
                title="Logout"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-gutter max-w-container-max mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <div className="space-y-gutter pb-10">
              {/* Date Filter Bar */}
              <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 glass-card p-6 border-white/5 mb-8">
                <div className="space-y-1">
                  <h4 className="font-display-lg text-headline-sm uppercase tracking-tight">Temporal Scope</h4>
                  <p className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Define analytics horizon</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                  <div className="flex flex-1 items-center gap-3 bg-surface-container-low p-2 px-4 rounded-sm border border-white/5">
                    <span className="font-label-caps text-[10px] text-outline uppercase">Debut</span>
                    <input 
                      type="date" 
                      className="bg-transparent border-none font-label-caps text-[11px] tracking-widest text-on-surface outline-none w-full"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-3 bg-surface-container-low p-2 px-4 rounded-sm border border-white/5">
                    <span className="font-label-caps text-[10px] text-outline uppercase">Final</span>
                    <input 
                      type="date" 
                      className="bg-transparent border-none font-label-caps text-[11px] tracking-widest text-on-surface outline-none w-full"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setDateRange({
                        start: new Date().toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                      });
                    }}
                    className="p-3 bg-on-surface text-background rounded-sm hover:opacity-80 transition-all flex items-center justify-center"
                    title="Reset to Today"
                  >
                    <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards - Dynamic Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-gutter">
                <div className="col-span-2 sm:col-span-1">
                  <MetricCard 
                    title="Sales" 
                    value={formatCurrency(stats?.totalRevenue || 0, currency)} 
                    growth={stats?.revenueGrowth || 0} 
                    chartPath="M0,35 Q25,30 40,20 T70,10 T100,5"
                  />
                </div>
                <MetricCard 
                  title="Orders" 
                  value={Number(stats?.totalOrders || 0).toLocaleString()} 
                  growth={stats?.ordersGrowth || 0} 
                  chartPath="M0,38 Q20,35 40,32 T60,25 T100,15"
                />
                <MetricCard 
                  title="Users" 
                  value={Number(stats?.newCustomers || 0).toLocaleString()} 
                  growth={stats?.customersGrowth || 0} 
                  chartPath="M0,5 Q30,15 50,25 T100,35"
                  colorClass="text-primary"
                />
                <MetricCard 
                  title="Conv." 
                  value={`${stats?.conversionRate?.toFixed ? stats?.conversionRate.toFixed(2) : stats?.conversionRate || 0}%`} 
                  growth={stats?.conversionGrowth || 0} 
                  chartPath="M0,30 Q30,25 50,15 T100,5"
                  colorClass="text-tertiary"
                />
                <MetricCard 
                  title="AOV" 
                  value={formatCurrency(stats?.avgOrderValue || 0, currency)} 
                  growth={stats?.aovGrowth || 0} 
                  chartPath="M0,20 Q50,20 100,20"
                  colorClass="text-outline"
                />
              </div>

              {/* Main Chart & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                <div className="lg:col-span-8 glass-card p-6 md:p-8 group overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h4 className="font-display-lg text-headline-sm md:text-headline-md uppercase tracking-tight">Growth</h4>
                      <p className="font-label-caps text-[10px] text-outline mt-1 uppercase tracking-widest">Monthly Analytics</p>
                    </div>
                    <div className="flex gap-2">
                      {['1M', '6M', '1Y'].map(range => (
                        <button
                          key={range}
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();

                            if (range === '1M') {
                              start.setMonth(end.getMonth() - 1);
                            } else if (range === '6M') {
                              start.setMonth(end.getMonth() - 6);
                            } else if (range === '1Y') {
                              start.setFullYear(end.getFullYear() - 1);
                            }

                            setSelectedRange(range);
                            setDateRange({
                              start: start.toISOString().split('T')[0],
                              end: end.toISOString().split('T')[0]
                            });
                          }}
                          className={`px-3 py-1 text-[10px] font-label-caps border border-white/10 rounded-sm transition-all ${selectedRange === range ? 'bg-on-surface text-background' : 'hover:bg-white/5'}`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative h-48 md:h-64 w-full">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                      <defs>
                        <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.2"></stop>
                          <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path d={chartAreaPath} fill="url(#gradient)"></path>
                      <path className="chart-gradient-line text-primary" d={chartPath} fill="none" stroke="currentColor" strokeWidth="2"></path>
                    </svg>
                    <div className="flex justify-between mt-6 font-label-caps text-[8px] md:text-[9px] text-outline tracking-widest px-2">
                      {chartLabels.length > 0 ? chartLabels.map((label, index) => (
                        <span key={`${label}-${index}`} className="truncate">{label}</span>
                      )) : ['J','F','M','A','M','J','J','A','S','O','N','D'].map(m => <span key={m}>{m}</span>)}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 glass-card p-6 md:p-8">
                  <div className="mb-8 border-b border-white/5 pb-4">
                    <h4 className="font-display-lg text-headline-sm uppercase">Top Models</h4>
                    <p className="font-label-caps text-[10px] text-outline mt-1 uppercase">Leading archives</p>
                  </div>
                  <div className="space-y-6">
                    {topProducts.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center gap-4 group cursor-pointer hover:bg-white/5 p-2 -m-2 transition-colors duration-300">
                        <div className="w-12 h-12 bg-surface-container-highest rounded-sm flex-shrink-0 overflow-hidden border border-white/10">
                          <img alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" src={p.image_url} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label-caps text-[11px] truncate uppercase">{p.name}</p>
                          <p className="text-[9px] text-outline">{p.total_sold} sold</p>
                        </div>
                        <span className="material-symbols-outlined text-outline text-[18px] group-hover:text-on-surface transition-colors">arrow_forward</span>
                      </div>
                    ))}
                    {topProducts.length === 0 && <p className="text-[10px] text-outline uppercase text-center py-10">Empty registry.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                {/* Recent Orders List - Better for Mobile */}
                <div className="lg:col-span-8 glass-card overflow-hidden">
                  <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5">
                    <div>
                      <h4 className="font-display-lg text-headline-sm uppercase">Purchase Log</h4>
                      <p className="font-label-caps text-[10px] text-outline mt-1 uppercase">Live Stream</p>
                    </div>
                    <button onClick={() => setActiveTab('orders')} className="p-2 border border-white/10 hover:bg-white/5 transition-colors rounded-sm">
                      <span className="material-symbols-outlined text-[20px]">east</span>
                    </button>
                  </div>
                  
                  {/* Mobile-friendly order rows */}
                  <div className="divide-y divide-white/5">
                    {recentOrders.length > 0 ? recentOrders.map((o) => (
                      <div key={o.id} className="p-6 hover:bg-white/[0.02] transition-colors flex justify-between items-center group">
                        <div className="space-y-1">
                          <p className="font-label-caps text-[12px] text-on-surface">#VX-{o.id} • {o.customer_name}</p>
                          <p className="font-label-caps text-[9px] text-outline uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {o.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display-lg text-headline-sm text-primary">{formatCurrency(o.total_amount, currency)}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="p-20 text-center text-outline uppercase text-[10px] tracking-widest">Registry empty.</div>
                    )}
                  </div>
                </div>

                {/* Low Stock - Better for Mobile */}
                <div className="lg:col-span-4 glass-card p-6 md:p-8">
                  <div className="mb-8 border-b border-white/5 pb-4">
                    <h4 className="font-display-lg text-headline-sm uppercase">Stock Alert</h4>
                    <p className="font-label-caps text-[10px] text-outline mt-1 uppercase tracking-widest">Inventory depletion</p>
                  </div>
                  <div className="space-y-6">
                    {lowStockProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between group p-2 -m-2 hover:bg-white/5 transition-colors duration-300">
                        <div className="min-w-0">
                          <p className="font-label-caps text-[11px] truncate uppercase">{p.name}</p>
                          <p className="text-[9px] text-outline">ARCHIVE ID: {p.id.toString().padStart(4, '0')}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-display-lg text-headline-sm ${p.stock <= 2 ? 'text-error' : 'text-on-surface/80'}`}>
                            {p.stock}
                          </span>
                          <span className="font-label-caps text-[8px] text-outline block uppercase">units</span>
                        </div>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && <p className="text-[10px] text-outline uppercase text-center py-10 tracking-widest">Optimal supply.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'customers' && <AdminCustomers />}
          {activeTab === 'content' && <AdminContent />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>

        {/* Footer Section */}
        <footer className="mt-auto border-t border-white/10 bg-surface-container-lowest py-8 px-gutter">
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-label-caps text-[10px] text-outline tracking-widest uppercase">© 2024 {settings.site_name}. ARCHITECTURAL MINIMALISM IN OPTICS.</p>
            <div className="flex gap-6">
              <a className="font-label-caps text-[10px] text-outline hover:text-on-surface transition-colors tracking-widest uppercase" href="#">Support</a>
              <a className="font-label-caps text-[10px] text-outline hover:text-on-surface transition-colors tracking-widest uppercase" href="#">Privacy</a>
              <a className="font-label-caps text-[10px] text-outline hover:text-on-surface transition-colors tracking-widest uppercase" href="#">Terms</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
