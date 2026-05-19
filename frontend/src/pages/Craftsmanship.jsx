import { Link } from 'react-router-dom';

const Craftsmanship = () => {
  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="relative h-[921px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9MXwEWqfGaAMBJxUuR2FQo6VgS6BalmHoQJrvIpWLAlyaOCfZUHreI_0MnvowezSosuI2XFOS2TdpvQkDgU8Cxr-UUlhKc1Foq75yA9Eu890glY69p-7jtorr2RQRHg5vt8gUJzLaR2-CKS5Qw2z1fikN638bu4Tde2AeuLRJnitmHySDbSC7uIEDqQQThZBoT0RDTTlVdPieu1iyCv4_aX4-tlUVhAjRFJiGpnObn_vWvP57OLwqO8urN_mCP5VevCbf85qXukWt" 
          alt="Master optician crafting eyewear"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-gutter">
          <span className="font-label-caps text-label-caps text-primary mb-6 tracking-[0.3em] uppercase">CRAFTING VISION</span>
          <h1 className="font-display-lg text-[48px] md:text-[100px] text-white max-w-4xl mx-auto italic leading-[1] tracking-tight">Architectural precision in every curve.</h1>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-margin-desktop bg-surface">
        <div className="max-w-container-max mx-auto px-gutter py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
            <div className="md:col-span-5 mb-12 md:mb-0">
              <h2 className="font-label-caps text-label-caps text-primary tracking-widest mb-8 uppercase">OUR PHILOSOPHY</h2>
              <p className="font-headline-md text-headline-md text-on-surface leading-tight">
                We believe eyewear is the most intimate form of architecture—a bridge between the soul and the world.
              </p>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
                Visionix was founded on the principle that technical excellence shouldn't compromise aesthetic purity. We strip away the unnecessary until only the essential remains: perfect balance, weightless comfort, and crystalline clarity.
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Every pair of frames is a testament to the dialogue between heritage techniques and futuristic materials, designed for those who see beyond the surface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Process / Journey */}
      <section className="py-margin-desktop bg-surface-container-lowest py-24">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center mb-24">
            <h2 className="font-label-caps text-label-caps text-primary mb-4 tracking-widest uppercase">THE JOURNEY</h2>
            <p className="font-display-lg text-headline-md italic">From Concept to Concretion</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full border border-outline-variant flex items-center justify-center mb-8 group-hover:border-on-surface transition-colors duration-500">
                <span className="material-symbols-outlined text-3xl font-light">edit_note</span>
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface mb-4 tracking-widest">I. DESIGN</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Six months of iterative sketching ensures each frame respects the natural geometry of the face.</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full border border-outline-variant flex items-center justify-center mb-8 group-hover:border-on-surface transition-colors duration-500">
                <span className="material-symbols-outlined text-3xl font-light">architecture</span>
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface mb-4 tracking-widest">II. PROTOTYPING</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Using 3D precision modeling to stress-test hinges and balance before a single gram of titanium is cut.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full border border-outline-variant flex items-center justify-center mb-8 group-hover:border-on-surface transition-colors duration-500">
                <span className="material-symbols-outlined text-3xl font-light">precision_manufacturing</span>
              </div>
              <h3 className="font-label-caps text-label-caps text-on-surface mb-4 tracking-widest">III. HAND-FINISHING</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">Final polishing takes place over 72 hours, achieving a luster that only human touch can provide.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Materials Section */}
      <section className="py-margin-desktop bg-surface py-24">
        <div className="max-w-container-max mx-auto px-gutter">
          <h2 className="font-label-caps text-label-caps text-primary mb-16 border-l-2 border-primary pl-6 tracking-widest uppercase">MATERIAL INTEGRITY</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Material 1 */}
            <div className="bg-surface-container border border-white/5 overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwH1dl5k2coi3avBFyhuFdVTECZayBSV5nWoH7byacxKd6L7nClRdjOItryfBjBd3iB1aU5rjhfaBL70NAyO0BntRdaj2aP0xLBsRwNzvJnwCianfen9vmn27tV3FiZGyCigwj3XkR58CYgNaRWyJ5cVreXtcZDixwJWIMpKx2qjskonv-lU45YL4ycGGjee4KJ_OOMM6TCVsni_RaY0dEhv0wigfwRYRo9ZPuvbRItx1qcKnZZ08iVvCl4ukh3A9I0hSTM9k7EKUd" alt="Aerospace Titanium" />
              </div>
              <div className="p-8">
                <h4 className="font-label-caps text-label-caps text-on-surface mb-2 tracking-widest uppercase">AEROSPACE TITANIUM</h4>
                <p className="font-body-md text-body-md text-on-surface-variant italic">Strength-to-weight ratio redefined.</p>
              </div>
            </div>
            {/* Material 2 */}
            <div className="bg-surface-container border border-white/5 overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoyxY30frFEuHASnI5BA5M1Gpf5zqVlVl6avI-WdDvsS_uHoBO-5dV49u6UrYFj4GLSnf0bAaMEzaX2_DFDA7aHwj5SApehQB63ChFHCFUKWpjol-sw9vqZ8lgTXBHoJAISEIK2Eh20mQG9xBRNty0_PoamEyYyBmnHlt0ss6O1haqhypDgIbo3x3IkcKJXbqcBnPMEYxYPWTel8rDHe5AX4XE5dY6K4obeyraWeQlH8nWsKZkHLzO-s1RDWI56ir5SaupMVzhIQa-" alt="Japanese Acetate" />
              </div>
              <div className="p-8">
                <h4 className="font-label-caps text-label-caps text-on-surface mb-2 tracking-widest uppercase">JAPANESE ACETATE</h4>
                <p className="font-body-md text-body-md text-on-surface-variant italic">Plant-based, hand-polished depth.</p>
              </div>
            </div>
            {/* Material 3 */}
            <div className="bg-surface-container border border-white/5 overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeSVWb3dwLHcIWGqsBPr2sQbWG38diysJcQhuhQSbIs6eCgaTtcibbxhkWC9mteQX5_v7Oue5DZzn4f_nGLNIl2CvSTdaFtglr7Mk4NF3-MrWQLWF9hjUYy-qQTxsTvUlvGr2gxS7ReWpIKK2NmbdgzCN8qqJkhwKMsjBUy3k0jBEYtcv9z1YSAs1aQ3uaES31GKBks7FPBB5a2syQz_wMjc--YVifinm7aqnouOoPSZEXJKxTfFPpTzWlQtLkW522Q3GhtTqF2B98" alt="Precision Lenses" />
              </div>
              <div className="p-8">
                <h4 className="font-label-caps text-label-caps text-on-surface mb-2 tracking-widest uppercase">PRECISION LENSES</h4>
                <p className="font-body-md text-body-md text-on-surface-variant italic">Unrivaled clarity and protection.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="py-margin-desktop bg-surface-container-high overflow-hidden relative py-24">
        <div className="max-w-container-max mx-auto px-gutter relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-label-caps text-label-caps text-primary mb-8 tracking-widest uppercase">SUSTAINABILITY</h2>
              <h3 className="font-display-lg text-headline-md md:text-display-lg-mobile text-white mb-8">Circular by design, ethical by nature.</h3>
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <span className="material-symbols-outlined text-primary">eco</span>
                  <div>
                    <h4 className="font-label-caps text-label-caps text-on-surface mb-2 uppercase tracking-widest">RECYCLED PACKAGING</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">Our boxes are crafted from FSC-certified recycled paper and 100% organic cotton, eliminating single-use plastics.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <div>
                    <h4 className="font-label-caps text-label-caps text-on-surface mb-2 uppercase tracking-widest">ETHICAL SOURCING</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant">We partner exclusively with family-owned factories that guarantee fair wages and zero-waste production cycles.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <img 
                className="w-full aspect-[4/5] object-cover border border-white/10 grayscale hover:grayscale-0 transition-all duration-1000" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhblT6IzvLiJMWBpqllzjrr8KEDB4cmkeIpHar8nbvcWAvOiTUIYj9BnuJrTRswIsrqKj2dNTr59x81M2gCCbHNlnKiYUaNDFgbFyiKQgfEFXIl7i65p-8zZqGqC1lmFHCCncqgpJxUr-bJffztbJXmcm_UwKU3fCgs4huhqdrYykU6StqFM1lFICurseWAqOhdLU0slNKyiVZeFSC5Zx-2m4mpULvi1NasKqAoRZF898gBMeE1-vpYjJZfnu_MFstNgGUjYCW6WQx" 
                alt="Sustainable packaging"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 text-center bg-surface">
        <div className="max-w-4xl mx-auto px-gutter">
          <p className="font-label-caps text-label-caps text-primary mb-8 tracking-[0.3em] uppercase">THE NEXT EVOLUTION</p>
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md italic mb-12 text-on-surface">Experience the future of optics.</h2>
          <Link 
            to="/shop" 
            className="inline-block px-12 py-5 bg-white text-background font-label-caps text-label-caps hover:opacity-80 transition-opacity duration-300 uppercase tracking-widest"
          >
            Explore the Collection
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Craftsmanship;
