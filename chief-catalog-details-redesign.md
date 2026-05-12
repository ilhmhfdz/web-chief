# Redesign Document: CHIEF Product Detail Page (PDP)

## 1. Project Overview
**Objective:** Mengoptimalkan antarmuka pengguna (UI) untuk meningkatkan efisiensi navigasi dan tingkat konversi (CR) melalui pendekatan UX yang lebih ringkas dan *mobile-first*.

---

## 2. Analisis Masalah (Current Pain Points)
Berdasarkan tampilan saat ini, terdapat beberapa kendala yang menghambat *user journey*:
* **Vertical Bloat:** Informasi tersebar secara vertikal sehingga pengguna harus melakukan banyak *scrolling* untuk melihat detail penting.
* **Hierarki Visual Lemah:** Harga, stok, dan rating memiliki bobot visual yang sama, membuat mata sulit fokus pada informasi utama.
* **Informasi Pengiriman Boros Ruang:** Detail pengiriman dan jaminan menggunakan format *list* vertikal yang sebenarnya bisa diringkas.
* **Akses Transaksi Terbatas:** Tombol "Beli Sekarang" akan hilang saat pengguna men-scroll ke bawah untuk membaca deskripsi.

---

## 3. Strategi Desain Ulang (Redesign Strategies)

### A. Optimalisasi Area "Above the Fold"
* **Compact Header:** Memperkecil area breadcrumbs (`Beranda > Katalog > ...`) untuk memberikan ruang lebih bagi gambar produk.
* **Product Gallery 1:1:** Menggunakan rasio gambar persegi tanpa *border* kontainer yang tebal agar visual produk lebih "bersih" dan menonjol.

### B. Restrukturisasi Informasi Produk
* **Social Proof Integration:** Meletakkan Rating (4.9) dan Jumlah Terjual (340+) dalam satu baris tepat di bawah judul produk.
* **Price & Stock Clarity:** Harga dibuat lebih mencolok dengan font *bold*. Status stok ("11 tersedia") diletakkan di samping harga dengan warna yang kontras namun tidak mendominasi.

### C. Efisiensi Komponen Kepercayaan (Trust Signals)
* **Horizontal Icon Grid:** Mengubah detail "Garansi Tiba Besok", "15 Hari Pengembalian", dan "100% Original" menjadi barisan ikon horizontal. Ini menghemat ruang vertikal hingga 60%.

### D. UX Conversion Engine
* **Sticky Bottom Action Bar:** Mengimplementasikan bar navigasi bawah yang tetap muncul (*sticky*) berisi:
    * Tombol Chat (Ikon)
    * Tombol Tambah Keranjang (Ikon)
    * Tombol **Beli Sekarang** (Primary Action - Full Width Button).

---

## 4. Spesifikasi UI (UI Components)

| Komponen | Spesifikasi | Keterangan |
| :--- | :--- | :--- |
| **Typography** | Sans-serif (Inter/Google Sans) | Menjamin keterbacaan tinggi di layar mobile. |
| **Primary Color** | Dark Slate / Black | Mencerminkan brand "CHIEF" yang maskulin dan premium. |
| **Accent Color** | Amber / Gold | Digunakan untuk badge "Terlaris" dan Rating. |
| **Call to Action** | High Contrast Button | Tombol "Beli Sekarang" menggunakan warna solid untuk menarik perhatian. |

---

## 5. Perubahan Layout (Wireframe Logic)

### Layout Lama (Current)
1. Image (Large Border)
2. Title
3. Rating & Terjual (Separate line)
4. Price Box (Heavy)
5. Shipping List (3-4 lines)
6. Action Buttons (Stacked)

### Layout Baru (Redesigned)
1. **Header & Navigation** (Slim)
2. **Product Image** (Full width, clean)
3. **Core Info Group:**
   - Title
   - Row: Rating | Terjual | Favorite
   - Price & Stock Status
4. **Trust Badges Row** (3 Icons, 1 Line)
5. **Description Snippet** (Collapsible)
6. **Sticky CTA Bar** (Always visible at the bottom)

---

## 6. Kesimpulan
Redesign ini bertujuan untuk meminimalisir hambatan kognitif pengguna. Dengan menyatukan informasi penting di bagian atas dan menyediakan akses transaksi yang selalu tersedia (sticky), diharapkan pengguna dapat mengambil keputusan pembelian dengan lebih cepat dan nyaman.
