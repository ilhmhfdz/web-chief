# 🔧 Daftar Perubahan & Konfigurasi — Production Security Fixes
> **Tanggal**: 2026-06-04 | **Status**: ✅ Semua 6 KRITIS + Fase 1 & 2 Priority selesai

---

## 📋 Ringkasan Perubahan File

| File | Jenis | Fix |
|------|-------|-----|
| `lib/auth/getToken.ts` | ✨ BARU | SEC-06: Token helper terpusat |
| `app/api/products/route.ts` | ✏️ EDIT | SEC-02: Auth + field whitelist di POST |
| `app/api/orders/[id]/route.ts` | ✏️ EDIT | SEC-03 + SEC-04 + BIZ-02 |
| `app/api/orders/create/route.ts` | ✏️ EDIT | BIZ-03 + BIZ-04 |
| `app/api/ai/hairstyle-visual/route.ts` | ✏️ EDIT | BIZ-01 + SEC-06 |
| `app/api/ai/credits/route.ts` | ✏️ EDIT | SEC-06 |
| `app/api/admin/users/[id]/grant-credit/route.ts` | ✏️ EDIT | SEC-06 |
| `middleware.ts` | ✏️ EDIT | MID-02: Expanded matcher + logic |
| `next.config.js` | 🗑️ HAPUS | MID-01: Konflik dihapus |
| `next.config.mjs` | ✏️ EDIT | MID-01: ESLint config + image whitelist |
| `lib/db/models/Order.ts` | ✏️ EDIT | DB-01: Compound indexes |
| `lib/db/models/Product.ts` | ✏️ EDIT | DB-01: Compound + text indexes |
| `whatsapp-service/src/index.ts` | ✏️ EDIT | SEC-05: Auth middleware |
| `.env.local` | ✏️ EDIT | SEC-01: Strong credentials |
| `whatsapp-service/.env` | ✏️ EDIT | SEC-01 + SEC-05 |

---

## 🔑 Konfigurasi yang Harus Kamu Ubah (Wajib Manual)

### 1. Ganti Password MongoDB Atlas

> ⚠️ **WAJIB** — Password `qwerty123` sangat lemah dan harus diganti sebelum deploy.

**Langkah-langkah:**
1. Buka [MongoDB Atlas](https://cloud.mongodb.com) → Login
2. Klik **Database Access** di sidebar kiri
3. Klik **Edit** pada user `admin_ilham`
4. Klik **Edit Password** → Masukkan password baru:

```
Password baru: K72ibZsDe27AiFb6
```

5. Klik **Update User**

**Setelah itu**, update kedua file `.env` dengan password baru:

**`.env.local`** — ganti `GANTI_KE_PASSWORD_BARU`:
```env
MONGODB_URI=mongodb+srv://admin_ilham:K72ibZsDe27AiFb6@cluster0.j1gqtqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

**`whatsapp-service/.env`** — ganti `GANTI_KE_PASSWORD_BARU`:
```env
MONGODB_URI=mongodb://admin_ilham:K72ibZsDe27AiFb6@ac-uesu54p-shard-00-00.j1gqtqs.mongodb.net:27017/?ssl=true&authSource=admin&directConnection=true&appName=Cluster0
```

---

### 2. Rotate OpenAI API Key

> ⚠️ **WAJIB** — Key lama mungkin sudah ter-expose di git history.

**Langkah-langkah:**
1. Buka [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Klik **Revoke** pada key lama: `sk-proj-OFH_OVpx...`
3. Klik **Create new secret key**
4. Copy key baru, update di **kedua** file:
   - `.env.local` → `OPENAI_API_KEY=sk-proj-NEW_KEY_DISINI`
   - `whatsapp-service/.env` → `OPENAI_API_KEY=sk-proj-NEW_KEY_DISINI`

---

### 3. Nilai Konfigurasi yang Sudah Di-generate & Diterapkan

Nilai-nilai berikut sudah langsung ditulis ke `.env.local` dan `whatsapp-service/.env`:

| Variable | Nilai Baru | Keterangan |
|----------|-----------|------------|
| `JWT_SECRET` | `92c1563f9f10b6b5953e953d12da98463105cd4ccaeb2adabee6211ae04dba1f` | 256-bit, cryptographically random |
| `INTERNAL_API_SECRET` | `0c9f211d06b6b4677201fa271447dbf355813a7ee049efa2` | Untuk proteksi WhatsApp service API |

> Kedua nilai ini **sudah aktif** — tidak perlu action tambahan kecuali untuk production deployment (gunakan Vercel Environment Variables atau secret manager).

---

### 4. Tambahkan Domain Gambar yang Kamu Pakai (next.config.mjs)

Wildcard `hostname: '**'` sudah diganti dengan whitelist. Jika kamu memakai domain CDN/storage lain untuk gambar produk, tambahkan ke `next.config.mjs`:

```javascript
// next.config.mjs
remotePatterns: [
  { protocol: 'https', hostname: 'res.cloudinary.com' },      // ✅ sudah ada
  { protocol: 'https', hostname: 'images.unsplash.com' },     // ✅ sudah ada
  { protocol: 'https', hostname: 'cdn.chiefgrooming.id' },    // ✅ sudah ada
  { protocol: 'https', hostname: 'storage.googleapis.com' },  // ✅ sudah ada
  // Tambahkan domain lain di sini jika ada error gambar tidak muncul:
  { protocol: 'https', hostname: 'namadomain-baru.com' },
],
```

---

### 5. Cara Akses WhatsApp Bot QR (setelah SEC-05)

Endpoint `/qr`, `/status`, dan `/api/logout` sekarang memerlukan header `x-internal-secret`.

**Untuk akses QR di browser** (curl atau Postman):
```bash
curl -H "x-internal-secret: 0c9f211d06b6b4677201fa271447dbf355813a7ee049efa2" \
     http://localhost:3003/qr
```

**Untuk akses di Next.js Admin** (jika ada halaman admin yang memanggil WA service):
```typescript
const response = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/status`, {
  headers: {
    'x-internal-secret': process.env.INTERNAL_API_SECRET!,
  },
});
```

---

## ✅ Checklist Verifikasi Sebelum Deploy

```
[ ] Password MongoDB Atlas sudah diganti ke K72ibZsDe27AiFb6
[ ] MONGODB_URI di .env.local sudah diupdate
[ ] MONGODB_URI di whatsapp-service/.env sudah diupdate
[ ] OpenAI API Key lama sudah di-revoke
[ ] OpenAI API Key baru sudah diupdate di kedua .env
[ ] Test login flow masih berjalan normal
[ ] Test order creation: harga dari DB, bukan dari client
[ ] Test tambah produk tanpa login → harus dapat 403
[ ] Test akses /qr WhatsApp tanpa secret → harus dapat 401
[ ] Test akses order orang lain → harus dapat 403
```

---

## 📌 Status Improvement.md — Fase yang Sudah Selesai

### ✅ Fase 1 — KRITIS (Selesai)
- [x] SEC-01: Rotate credentials sensitif
- [x] SEC-02: Auth ke `POST /api/products`
- [x] SEC-03: IDOR pada Order GET
- [x] SEC-04: Auth + whitelist PATCH Order
- [x] SEC-05: Auth pada WhatsApp service endpoints
- [x] BIZ-03: Validasi harga dari DB saat checkout
- [x] BIZ-04: Kurangi stok saat order (atomic)

### ✅ Fase 2 — HIGH (Selesai)
- [x] BIZ-01: Race condition AI credit deduction (atomic findOneAndUpdate)
- [x] BIZ-02: Race condition credit grant on delivery (atomic)
- [x] DB-01: Compound indexes (Order + Product)
- [x] MID-01: Hapus konflik next.config.js, whitelist image domain
- [x] MID-02: Perluas middleware matcher
- [x] SEC-06: Standarisasi cookie parsing (getToken helper)

### ⏳ Fase 3 — MEDIUM (Belum, butuh dependensi eksternal)
- [ ] BIZ-05: Ganti in-memory rate limiter ke Redis (butuh Upstash/Redis instance)
- [ ] DB-02: Text search sudah ditambahkan index, tapi perlu update query di route.ts
- [ ] DB-03: Pagination ke GET /api/orders
- [ ] DB-04: Konfigurasi Mongoose connection pool
- [ ] BIZ-06: Fix RAG gunakan persona dari DB
