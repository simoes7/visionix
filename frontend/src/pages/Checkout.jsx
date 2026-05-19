import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';

const Checkout = () => {
  const { cartItems, subtotal } = useCart();
  const { settings } = useSettings();
  const currency = settings.currency || 'USD';
  const [shippingMethod, setShippingMethod] = useState('standard');
  const shippingCost = shippingMethod === 'express' ? 25 : 0;
  const total = subtotal + shippingCost;

  return (
    <main className="pt-32 pb-24 px-gutter max-w-container-max mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column: Checkout Flow */}
        <div className="lg:col-span-7">
          <Link to="/cart" className="inline-flex items-center gap-2 font-label-caps text-label-caps text-on-surface/60 hover:text-on-surface transition-colors mb-12">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            BACK TO CART
          </Link>

          {/* Step Indicator */}
          <div className="flex items-center gap-8 mb-16 overflow-x-auto whitespace-nowrap pb-4 hide-scrollbar">
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-label-caps text-on-surface bg-on-surface/10 w-8 h-8 flex items-center justify-center rounded-full">01</span>
              <span className="font-label-caps text-label-caps text-on-surface">SHIPPING</span>
            </div>
            <div className="h-[1px] w-12 bg-white/10"></div>
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-label-caps text-on-surface/40 border border-white/10 w-8 h-8 flex items-center justify-center rounded-full">02</span>
              <span className="font-label-caps text-label-caps text-on-surface/40">PAYMENT</span>
            </div>
            <div className="h-[1px] w-12 bg-white/10"></div>
            <div className="flex items-center gap-3">
              <span className="font-label-caps text-label-caps text-on-surface/40 border border-white/10 w-8 h-8 flex items-center justify-center rounded-full">03</span>
              <span className="font-label-caps text-label-caps text-on-surface/40">REVIEW</span>
            </div>
          </div>

          {/* Shipping Form Section */}
          <section className="space-y-12">
            <header>
              <h1 className="font-headline-md text-headline-md mb-2">Shipping Information</h1>
              <p className="text-on-surface-variant font-body-md">Enter your delivery details below to calculate shipping.</p>
            </header>
            
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <label className="font-label-caps text-[10px] text-on-surface/60 mb-1">FIRST NAME</label>
                  <input className="input-minimal text-on-surface placeholder:text-on-surface/20" placeholder="Julian" type="text"/>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-[10px] text-on-surface/60 mb-1">LAST NAME</label>
                  <input className="input-minimal text-on-surface placeholder:text-on-surface/20" placeholder="Voss" type="text"/>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="font-label-caps text-[10px] text-on-surface/60 mb-1">STREET ADDRESS</label>
                <input className="input-minimal text-on-surface placeholder:text-on-surface/20" placeholder="1248 Minimalist Boulevard, Suite 200" type="text"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col">
                  <label className="font-label-caps text-[10px] text-on-surface/60 mb-1">CITY</label>
                  <input className="input-minimal text-on-surface placeholder:text-on-surface/20" placeholder="Berlin" type="text"/>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-[10px] text-on-surface/60 mb-1">POSTAL CODE</label>
                  <input className="input-minimal text-on-surface placeholder:text-on-surface/20" placeholder="10115" type="text"/>
                </div>
                <div className="flex flex-col">
                  <label className="font-label-caps text-[10px] text-on-surface/60 mb-1">COUNTRY</label>
                  <select className="input-minimal text-on-surface bg-transparent appearance-none cursor-pointer">
                    <option className="bg-surface text-on-surface">Germany</option>
                    <option className="bg-surface text-on-surface">United Kingdom</option>
                    <option className="bg-surface text-on-surface">France</option>
                    <option className="bg-surface text-on-surface">United States</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Shipping Methods */}
            <div className="pt-12">
              <h2 className="font-headline-sm text-headline-sm mb-6">Delivery Method</h2>
              <div className="grid grid-cols-1 gap-4">
                <label 
                  className={`relative flex items-center justify-between p-6 glass-card cursor-pointer group hover:border-white/30 transition-all border ${shippingMethod === 'standard' ? 'border-on-surface' : 'border-white/5'}`}
                  onClick={() => setShippingMethod('standard')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'standard' ? 'border-on-surface' : 'border-white/10'}`}>
                      {shippingMethod === 'standard' && <div className="w-2.5 h-2.5 bg-on-surface rounded-full"></div>}
                    </div>
                    <div>
                      <p className="font-label-caps text-label-caps text-on-surface">STANDARD DELIVERY</p>
                      <p className="text-sm text-on-surface-variant">3-5 Business Days</p>
                    </div>
                  </div>
                  <span className="font-label-caps text-on-surface">FREE</span>
                </label>

                <label 
                  className={`relative flex items-center justify-between p-6 glass-card cursor-pointer group hover:border-white/30 transition-all border ${shippingMethod === 'express' ? 'border-on-surface' : 'border-white/5'}`}
                  onClick={() => setShippingMethod('express')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'express' ? 'border-on-surface' : 'border-white/10'}`}>
                      {shippingMethod === 'express' && <div className="w-2.5 h-2.5 bg-on-surface rounded-full"></div>}
                    </div>
                    <div>
                      <p className="font-label-caps text-label-caps text-on-surface">EXPRESS PRIORITY</p>
                      <p className="text-sm text-on-surface-variant">Next Day Air</p>
                    </div>
                  </div>
                  <span className="font-label-caps text-on-surface">{formatCurrency(25, currency)}</span>
                </label>
              </div>
            </div>

            <div className="pt-8">
              <button className="w-full md:w-auto px-12 py-5 bg-white text-black font-label-caps text-label-caps hover:opacity-80 transition-all">
                PROCEED TO PAYMENT
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <aside className="lg:col-span-5">
          <div className="sticky top-32 glass-card p-8 lg:p-12">
            <h3 className="font-headline-sm text-headline-sm mb-8">Order Summary</h3>
            
            {cartItems.length === 0 ? (
              <p className="text-on-surface-variant mb-12">Your bag is empty.</p>
            ) : (
              <div className="space-y-8 mb-12">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-6">
                    <div className="w-24 h-24 bg-surface-container overflow-hidden border border-white/10">
                      <img alt={item.name} className="w-full h-full object-cover" src={item.image_url} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <p className="font-label-caps text-label-caps text-on-surface mb-1 uppercase">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">Qty {item.quantity}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="font-label-caps text-on-surface">{formatCurrency(item.price * item.quantity, currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-4 pt-8 border-t border-white/10">
              <div className="flex justify-between font-label-caps text-label-caps">
                <span className="text-on-surface-variant">SUBTOTAL</span>
                <span className="text-on-surface">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between font-label-caps text-label-caps">
                <span className="text-on-surface-variant">SHIPPING</span>
                <span className="text-on-surface">{shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost, currency)}</span>
              </div>
              <div className="flex justify-between font-label-caps text-label-caps">
                <span className="text-on-surface-variant">ESTIMATED TAX</span>
                <span className="text-on-surface">{formatCurrency(0, currency)}</span>
              </div>
              <div className="flex justify-between pt-4 mt-4 border-t border-white/10">
                <span className="font-headline-sm text-headline-sm">Total</span>
                <span className="font-headline-sm text-headline-sm tracking-tight">{formatCurrency(total, currency)}</span>
              </div>
            </div>

            {/* Discount Field */}
            <div className="mt-12">
              <div className="flex gap-2">
                <input className="flex-1 input-minimal font-label-caps text-[10px] placeholder:text-on-surface/20" placeholder="DISCOUNT CODE" type="text"/>
                <button className="font-label-caps text-label-caps text-on-surface/60 hover:text-on-surface border-b border-transparent hover:border-on-surface transition-all">APPLY</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
