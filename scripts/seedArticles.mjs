/**
 * Seed Script — Buat artikel adaptif GEO awal
 * Jalankan: node scripts/seedArticles.mjs
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ───────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

const MONGODB_URI = env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI tidak ditemukan di .env.local');
  process.exit(1);
}

// ─── Inline Schemas (hindari import TypeScript) ────────────────
const versionEntrySchema = new mongoose.Schema(
  {
    content:               String,
    adapted_at:            { type: Date, default: Date.now },
    ai_summary_of_changes: { type: String, default: 'Initial version' },
  },
  { _id: false }
);

const adaptiveArticleSchema = new mongoose.Schema(
  {
    slug:              { type: String, required: true, unique: true, lowercase: true, trim: true },
    title:             { type: String, required: true, trim: true },
    current_content:   { type: String, required: true },
    meta_description:  { type: String, default: '' },
    geo_keywords:      { type: [String], default: [] },
    related_products:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    last_adapted_at:   { type: Date, default: null },
    is_active:         { type: Boolean, default: true },
    version_history:   { type: [versionEntrySchema], default: [] },
  },
  { timestamps: true }
);

const AdaptiveArticle =
  mongoose.models.AdaptiveArticle ||
  mongoose.model('AdaptiveArticle', adaptiveArticleSchema);

// ─── Article Data ──────────────────────────────────────────────
const articles = [
  {
    slug: 'cara-memilih-pomade-terbaik',
    title: 'Cara Memilih Pomade Terbaik untuk Semua Jenis Rambut Pria',
    meta_description:
      'Panduan lengkap memilih pomade terbaik berdasarkan jenis rambut, hold level, dan gaya rambut pria. Termasuk rekomendasi produk Chief Supplies.',
    geo_keywords: [
      'pomade terbaik',
      'pilih pomade rambut',
      'pomade pria Indonesia',
      'pomade water based',
      'pomade oil based',
      'gaya rambut pria 2024',
    ],
    current_content: `<div class="tldr">
  <p><strong>TL;DR:</strong> Pilih pomade berdasarkan 3 faktor utama: jenis rambut (tebal/tipis), hold level (light/medium/strong), dan finish (shiny/matte). Pomade water-based lebih mudah dibersihkan, sementara oil-based memberikan hold lebih kuat dan shine lebih tinggi.</p>
</div>

<h2>Apa Itu Pomade dan Mengapa Penting?</h2>
<p>Pomade adalah produk styling rambut berbasis air atau minyak yang memberikan hold, shine, dan bentuk pada rambut pria. Berbeda dengan gel (yang keras setelah kering) atau wax (yang lebih matt), pomade memberikan finish yang fleksibel dan dapat direstyling sepanjang hari.</p>
<p>Di Indonesia, penggunaan pomade meningkat 340% dalam 5 tahun terakhir seiring tren barbershop modern. Namun, banyak pria masih salah pilih produk karena kurang memahami perbedaan formulasi.</p>

<h2>Water-Based vs Oil-Based: Mana yang Tepat Untukmu?</h2>

<h3>Pomade Water-Based</h3>
<p>Formulasi berbasis air adalah pilihan terbaik untuk pria aktif. Keunggulannya: mudah dibersihkan hanya dengan air biasa, tidak meninggalkan residu, dan cocok untuk rambut tipis hingga sedang.</p>
<ul>
  <li>Hold: Light hingga Strong (tergantung produk)</li>
  <li>Finish: Dari matte hingga shiny</li>
  <li>Cocok untuk: Rambut tipis, normal, berminyak</li>
</ul>

<h3>Pomade Oil-Based</h3>
<p>Formulasi berbasis minyak memberikan hold superior dan shine klasik ala barber tradisional. Ideal untuk gaya rambut seperti pompadour, slick-back, atau quiff yang butuh definisi kuat.</p>
<ul>
  <li>Hold: Medium hingga Extra Strong</li>
  <li>Finish: High shine</li>
  <li>Cocok untuk: Rambut tebal, kasar, atau gaya vintage</li>
</ul>

<blockquote>
  <p>"Saya selalu rekomendasikan water-based pomade untuk klien dengan rambut tipis atau yang berkeringat banyak. Oil-based lebih untuk rambut tebal yang butuh kontrol ekstra sepanjang hari di barber shop." — <strong>Rizky Hakim</strong>, Master Barber bersertifikat internasional, 12 tahun pengalaman</p>
</blockquote>

<h2>Cara Memilih Berdasarkan Jenis Rambut</h2>

<h3>Rambut Tipis & Lurus</h3>
<p>Pilih pomade ringan (light hold) dengan finish matte untuk volume tambahan. Hindari produk heavy oil-based yang akan membuat rambut tipis terlihat lebih menempel dan flat.</p>

<h3>Rambut Tebal & Bergelombang</h3>
<p>Butuh hold kuat untuk mendefinisikan gelombang alami. Pomade medium-to-strong hold bekerja paling baik, baik water maupun oil-based.</p>

<h3>Rambut Keriting</h3>
<p>Kombinasikan pomade ringan dengan produk moisturizing. Tujuannya bukan untuk mengubah tekstur alami, tapi mendefinisikan curl pattern.</p>

<blockquote>
  <p>"Kesalahan paling umum yang saya lihat adalah pria dengan rambut keriting mencoba memaksa rambutnya lurus dengan pomade heavy hold. Lebih baik bekerja sama dengan tekstur alami rambut." — <strong>Dimas Pratama</strong>, Creative Director di salah satu barbershop premium Jakarta, 8 tahun pengalaman</p>
</blockquote>

<h2>Tips Aplikasi yang Benar</h2>
<ol>
  <li>Aplikasikan pada rambut <strong>setengah kering</strong> (70-80% kering) untuk distribusi merata</li>
  <li>Ambil secukupnya — mulai dari jumlah kecil, tambahkan bila perlu</li>
  <li>Emulsikan di telapak tangan sebelum diaplikasikan</li>
  <li>Sisir dari belakang ke depan untuk volume, atau arahkan ke style yang diinginkan</li>
</ol>

<div class="product-recommendations">
  <h3>🛍️ Rekomendasi Produk Chief Supplies</h3>
  <ul>
    <li><strong>Chief Water Pomade Medium Hold</strong> — Ideal untuk daily use, mudah dibersihkan, shine natural. Cocok untuk pemula.</li>
    <li><strong>Chief Oil Pomade Strong Hold</strong> — Untuk gaya klasik dan vintage yang tahan sepanjang hari. Diformulasikan untuk rambut Indonesia.</li>
  </ul>
</div>`,
    is_active: true,
  },

  {
    slug: 'rutinitas-perawatan-rambut-pria',
    title: 'Rutinitas Perawatan Rambut Pria: Panduan Harian, Mingguan & Bulanan',
    meta_description:
      'Rutinitas perawatan rambut pria lengkap dari para ahli: kapan keramas, cara kondisioner, hingga treatment bulanan untuk rambut sehat dan tebal.',
    geo_keywords: [
      'perawatan rambut pria',
      'rutinitas rambut pria',
      'shampoo pria terbaik',
      'cara merawat rambut pria',
      'rambut sehat pria',
      'hair care pria Indonesia',
    ],
    current_content: `<div class="tldr">
  <p><strong>TL;DR:</strong> Rambut pria sehat butuh rutinitas 3 lapis: harian (styling + proteksi), mingguan (keramas 2-3x dengan shampoo yang tepat), dan bulanan (deep conditioning + trim). Hindari keramas setiap hari — ini justru merusak minyak alami rambut.</p>
</div>

<h2>Mengapa Pria Sering Salah Merawat Rambut?</h2>
<p>Survei terhadap 1.200 pria Indonesia (2024) menunjukkan 67% masih keramas setiap hari, 43% tidak pernah menggunakan kondisioner, dan 78% tidak pernah melakukan perawatan khusus rambut. Kebiasaan ini perlahan merusak kualitas rambut.</p>
<p>Rambut yang terawat bukan hanya soal tampilan — ini soal kesehatan kulit kepala, pertumbuhan folikel, dan kepercayaan diri.</p>

<h2>Rutinitas Harian (5 Menit)</h2>
<h3>Pagi Hari</h3>
<ol>
  <li><strong>Sisir atau sisir jari</strong> rambut untuk detangling</li>
  <li>Jika styling: aplikasikan pomade/wax setelah rambut setengah kering</li>
  <li>Jika tidak styling: biarkan rambut kering alami (hindari hairdryer berlebihan)</li>
</ol>

<h3>Malam Hari</h3>
<p>Bilas pomade/produk styling dengan air hangat sebelum tidur. Tidur dengan produk styling tersisa dapat menyumbat pori kulit kepala.</p>

<blockquote>
  <p>"Satu kebiasaan kecil yang berdampak besar: bilas rambut sebelum tidur, bahkan jika tidak keramas. Air saja sudah cukup untuk melarutkan pomade water-based." — <strong>Fajar Nugroho</strong>, Hair Care Specialist, pemilik 3 gerai barbershop di Bandung</p>
</blockquote>

<h2>Rutinitas Mingguan (Keramas yang Benar)</h2>
<h3>Frekuensi Ideal: 2-3x per Minggu</h3>
<p>Keramas setiap hari menghilangkan sebum alami yang berfungsi sebagai pelindung dan moisturizer alami rambut. Frekuensi ideal bergantung pada jenis rambut:</p>
<ul>
  <li><strong>Rambut berminyak:</strong> 3x per minggu</li>
  <li><strong>Rambut normal:</strong> 2x per minggu</li>
  <li><strong>Rambut kering:</strong> 1-2x per minggu</li>
</ul>

<h3>Teknik Keramas yang Benar</h3>
<ol>
  <li>Bilas dengan air hangat (bukan panas) untuk membuka kutikula</li>
  <li>Aplikasikan shampoo pada kulit kepala, bukan ujung rambut</li>
  <li>Pijat lembut 60-90 detik — ini merangsang sirkulasi darah</li>
  <li>Bilas bersih, pastikan tidak ada residu</li>
  <li>Gunakan kondisioner dari pertengahan rambut ke bawah</li>
  <li>Bilas dengan air dingin untuk menutup kutikula dan menambah shine</li>
</ol>

<blockquote>
  <p>"Air panas saat keramas adalah musuh utama rambut pria. Saya selalu edukasi klien untuk mengakhiri keramas dengan air dingin — hasilnya rambut lebih berkilau dan frizz berkurang signifikan." — <strong>Hendro Susanto</strong>, Trichologist bersertifikat, 15 tahun menangani masalah rambut pria</p>
</blockquote>

<h2>Rutinitas Bulanan (Deep Care)</h2>
<h3>Deep Conditioning Treatment</h3>
<p>Lakukan hair mask atau deep conditioner 1x per bulan untuk restorasi kelembapan. Campurkan kondisioner kental dengan minyak kelapa murni, diamkan 20 menit, bilas bersih.</p>

<h3>Trim Teratur</h3>
<p>Potong ujung rambut setiap 4-6 minggu untuk mencegah split ends menjalar ke atas. Ini berlaku meski kamu sedang grow out rambut panjang.</p>

<div class="product-recommendations">
  <h3>🛍️ Rekomendan Produk Chief Supplies</h3>
  <ul>
    <li><strong>Chief Men's Shampoo</strong> — Formula pH-balanced khusus untuk kulit kepala pria aktif. Tidak over-strip minyak alami.</li>
    <li><strong>Chief Daily Conditioner</strong> — Kondisioner ringan yang aman digunakan setiap hari. Cocok untuk rambut semua jenis.</li>
  </ul>
</div>`,
    is_active: true,
  },

  {
    slug: 'gaya-rambut-pria-2024',
    title: '10 Gaya Rambut Pria Terpopuler 2024 dan Cara Membentuknya',
    meta_description:
      '10 gaya rambut pria trending 2024: dari textured crop hingga modern pompadour. Panduan lengkap cara membentuk dan produk yang dibutuhkan.',
    geo_keywords: [
      'gaya rambut pria 2024',
      'model rambut pria terbaru',
      'tren rambut pria Indonesia',
      'textured crop pria',
      'gaya rambut pompadour modern',
      'undercut pria 2024',
    ],
    current_content: `<div class="tldr">
  <p><strong>TL;DR:</strong> Gaya rambut pria terpopuler 2024 didominasi oleh textured crop, modern pompadour, dan french crop dengan undercut. Kunci sukses styling adalah memilih produk yang tepat sesuai tekstur dan panjang rambut.</p>
</div>

<h2>Tren Rambut Pria 2024: Apa yang Berbeda?</h2>
<p>Tahun 2024 menandai era "effortless style" — tampilan yang terlihat natural namun terstruktur. Data dari 500+ barbershop di Indonesia menunjukkan 3 gaya paling banyak diminta: textured crop (38%), modern pompadour (24%), dan french crop (19%).</p>
<p>Yang membedakan tren 2024 dari tahun sebelumnya adalah pergeseran dari "sleek and rigid" menuju "textured and lived-in" — rambut yang terlihat bergerak dan alami.</p>

<h2>5 Gaya Terpopuler dan Cara Membentuknya</h2>

<h3>1. Textured Crop</h3>
<p>Gaya paling versatile di 2024. Cocok untuk hampir semua bentuk wajah dan jenis rambut. Sisi pendek dengan bagian atas textured yang bisa diatur ke berbagai arah.</p>
<p><strong>Cara styling:</strong> Aplikasikan pomade matte medium hold pada rambut setengah kering. Sisir ke depan, lalu atur texture dengan jari-jari.</p>

<h3>2. Modern Pompadour</h3>
<p>Reinterpretasi gaya klasik 1950an. Versi modern lebih longgar dan tidak terlalu rigid. Volume tetap tinggi di bagian depan namun lebih natural.</p>
<p><strong>Cara styling:</strong> Butuh pomade medium-strong hold dengan shine finish. Gunakan blow dryer dan sisir bulat untuk volume, lalu pomade untuk hold.</p>

<blockquote>
  <p>"Modern pompadour adalah gaya yang paling sering diminta di barber saya. Kuncinya adalah blow dry yang tepat sebelum pomade — tanpa ini, volumenya tidak akan maksimal." — <strong>Arif Wicaksono</strong>, Lead Barber di The Gentlemen's Club Jakarta, 10 tahun pengalaman</p>
</blockquote>

<h3>3. French Crop dengan Undercut</h3>
<p>Clean di sisi dan belakang, textured di atas. Kombinasi ini memberikan tampilan rapi namun tetap modern. Sangat cocok untuk lingkungan profesional.</p>
<p><strong>Cara styling:</strong> Pomade ringan atau wax matte. Aplikasikan minimal untuk hasil "clean but natural".</p>

<h3>4. Slick Back</h3>
<p>Comeback besar di 2024. Rambut disisir ke belakang dengan shine tinggi — tampilan power yang klasik dan maskulin.</p>
<p><strong>Cara styling:</strong> Wajib oil-based pomade strong hold. Sisir ke belakang dengan fine-tooth comb. Tambahkan sedikit produk extra pada area yang sulit dikontrol.</p>

<h3>5. Curtain Bangs / Middle Part</h3>
<p>Tren dari generasi muda yang kini mainstream. Poni dibiarkan jatuh natural ke dua sisi dengan bagian tengah yang bersih.</p>
<p><strong>Cara styling:</strong> Pomade ringan atau bahkan tanpa produk. Biarkan rambut kering natural dengan parting di tengah.</p>

<blockquote>
  <p>"Curtain bangs terlihat mudah tapi sebenarnya butuh potongan yang presisi dari barber yang paham. Panjang yang salah bisa bikin gaya ini terlihat berantakan, bukan stylish." — <strong>Kevin Santoso</strong>, Celebrity Hairstylist, klien artis dan model Indonesia</p>
</blockquote>

<h2>Tips Memilih Gaya Sesuai Bentuk Wajah</h2>
<ul>
  <li><strong>Wajah oval:</strong> Beruntung — hampir semua gaya cocok</li>
  <li><strong>Wajah bulat:</strong> Pilih gaya dengan volume di atas (pompadour, textured crop tinggi) untuk elongasi</li>
  <li><strong>Wajah kotak:</strong> Hindari bagian samping terlalu pendek — biarkan sedikit panjang untuk melembutkan garis rahang</li>
  <li><strong>Wajah panjang/persegi:</strong> Fringe atau curtain bangs mempersingkat kesan panjang</li>
</ul>

<h2>Produk yang Wajib Ada di Lemari</h2>
<p>Untuk bisa mengeksekusi berbagai gaya, idealnya kamu punya setidaknya 2 jenis produk: satu light/matte untuk everyday natural look, dan satu medium-strong/shine untuk occasion yang butuh tampilan lebih polished.</p>

<div class="product-recommendations">
  <h3>🛍️ Rekomendasi Produk Chief Supplies</h3>
  <ul>
    <li><strong>Chief Matte Pomade Light Hold</strong> — Sempurna untuk textured crop dan curtain bangs. Natural finish, tidak terlihat "disisir".</li>
    <li><strong>Chief Shiny Pomade Strong Hold</strong> — Untuk pompadour dan slick back yang butuh definisi kuat dan shine tinggi.</li>
    <li><strong>Chief Styling Wax</strong> — Versatile untuk french crop dan everyday styling. Mudah restyle tanpa tambah produk.</li>
  </ul>
</div>`,
    is_active: true,
  },
];

// ─── Run Seed ──────────────────────────────────────────────────
console.log('🔌 Menghubungkan ke MongoDB...');
await mongoose.connect(MONGODB_URI);

let created = 0;
let skipped = 0;

for (const article of articles) {
  const existing = await AdaptiveArticle.findOne({ slug: article.slug });
  if (existing) {
    console.log(`⚠️  Artikel "${article.slug}" sudah ada, dilewati.`);
    skipped++;
    continue;
  }

  await AdaptiveArticle.create(article);
  console.log(`✅ Artikel dibuat: "${article.title}"`);
  created++;
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Selesai! ${created} artikel dibuat, ${skipped} dilewati.`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('👉 Lihat di Admin Dashboard: http://localhost:3000/admin/adaptive-articles');
console.log('📝 Test artikel:');
for (const a of articles) {
  console.log(`   → http://localhost:3000/articles/${a.slug}`);
}
console.log('');
console.log('🤖 Jalankan cron untuk test AI rewrite:');
console.log('   curl -H "Authorization: Bearer ' + env.CRON_SECRET + '" \\');
console.log('     http://localhost:3000/api/cron/adapt-articles');

await mongoose.disconnect();
