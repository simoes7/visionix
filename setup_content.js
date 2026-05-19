import pool from './backend/config/db.js';

async function setupPageContent() {
  try {
    console.log('Creating page_content table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_content (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        page_name VARCHAR(50) NOT NULL,
        section_key VARCHAR(50) NOT NULL,
        content_type ENUM('text', 'image', 'json') NOT NULL,
        content_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_section (page_name, section_key)
      )
    `);

    // Initial content for Home page
    const homeContent = [
      ['home', 'hero_label', 'text', 'THE NEW ARCHITECTURE'],
      ['home', 'hero_title', 'text', 'Sculpted Vision for the Modern Vanguard.'],
      ['home', 'hero_image', 'image', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwX1CmMaN9fo8f0tvzJA4nOSHr155gHaX9GtUfYh2R0AV_dU_do-FoN4eBb4tT-HmaDKNb6_BwybPJvHWWiAbxNxjT3LWFlfkla7pqPrXBLZyP2Aej3mk9uhOp94g7XqM7k10hpNUOBJ5igTFsqAU-Tl9sNUqK30YipDoA0TqJooIQNo1SHUyKoWrkmNm0EvQvOQyjs8ZUkqknzHpULEeOZ4aeJox5PVc6bw9sAjGkyU9tr02Z7qyNfiVrmawuyqN84KaSdgtBxw_r'],
      ['home', 'future_vision_label', 'text', 'FUTURE VISION'],
      ['home', 'future_vision_title', 'text', 'AI Mirror: Virtual Fitting Reimagined'],
      ['home', 'future_vision_description', 'text', 'Experience our collections in high-fidelity 3D. Our proprietary AI Virtual Try-On maps your unique facial architecture with sub-millimeter precision.'],
      ['home', 'future_vision_image', 'image', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmj1nULSJc7xFX_ROKH7AecgqNk6Dor1pzpugsM7N3M6PqFxVA8YhaGs2ryYolC258VEYCLXpdDhp2ZmFti-cgU6r5GkAplFTO5AIlO5CkhUvwAL8QCKIWZjwI4C-HwzLAS5xOuNT9ZDnHIxR531moS53KafPUBGPbChSgYzN0_KZo8d8SFrVajwNVoAkGEv8nC9aM0dUUEUtzsrTd_32TtyM-XOzgfyoGSrY-ZqugHq0QxKZorFsCVxl7Lqa9423F5MfqilcKpZWJ'],
      ['home', 'quote_text', 'text', '"Visionix isn\'t just eyewear; it\'s a piece of architectural engineering for the face. The precision and weightlessness are unparalleled."'],
      ['home', 'quote_author', 'text', 'MARCUS CHEN — ARCHITECTURAL LEAD, GENESIS FIRM']
    ];

    // Initial content for About page
    const aboutContent = [
      ['about', 'hero_label', 'text', 'CRAFTING VISION'],
      ['about', 'hero_title', 'text', 'Architectural precision in every curve.'],
      ['about', 'hero_image', 'image', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9MXwEWqfGaAMBJxUuR2FQo6VgS6BalmHoQJrvIpWLAlyaOCfZUHreI_0MnvowezSosuI2XFOS2TdpvQkDgU8Cxr-UUlhKc1Foq75yA9Eu890glY69p-7jtorr2RQRHg5vt8gUJzLaR2-CKS5Qw2z1fikN638bu4Tde2AeuLRJnitmHySDbSC7uIEDqQQThZBoT0RDTTlVdPieu1iyCv4_aX4-tlUVhAjRFJiGpnObn_vWvP57OLwqO8urN_mCP5VevCbf85qXukWt'],
      ['about', 'philosophy_title', 'text', 'We believe eyewear is the most intimate form of architecture—a bridge between the soul and the world.'],
      ['about', 'philosophy_text_1', 'text', 'Visionix was founded on the principle that technical excellence shouldn\'t compromise aesthetic purity. We strip away the unnecessary until only the essential remains: perfect balance, weightless comfort, and crystalline clarity.'],
      ['about', 'philosophy_text_2', 'text', 'Every pair of frames is a testament to the dialogue between heritage techniques and futuristic materials, designed for those who see beyond the surface.'],
      ['about', 'sustainability_title', 'text', 'Circular by design, ethical by nature.'],
      ['about', 'sustainability_image', 'image', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhblT6IzvLiJMWBpqllzjrr8KEDB4cmkeIpHar8nbvcWAvOiTUIYj9BnuJrTRswIsrqKj2dNTr59x81M2gCCbHNlnKiYUaNDFgbFyiKQgfEFXIl7i65p-8zZqGqC1lmFHCCncqgpJxUr-bJffztbJXmcm_UwKU3fCgs4huhqdrYykU6StqFM1lFICurseWAqOhdLU0slNKyiVZeFSC5Zx-2m4mpULvi1NasKqAoRZF898gBMeE1-vpYjJZfnu_MFstNgGUjYCW6WQx']
    ];

    const allContent = [...homeContent, ...aboutContent];

    for (const [page, section, type, value] of allContent) {
      await pool.query(
        'INSERT INTO page_content (page_name, section_key, content_type, content_value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)',
        [page, section, type, value]
      );
    }

    console.log('Page content setup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setupPageContent();
