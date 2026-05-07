/**
 * Seed Script — Buat user Admin pertama
 * Jalankan: node scripts/createAdmin.mjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually
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

// ===== Ganti data ini sesuai keinginan =====
const ADMIN_NAME     = 'Admin Chief';
const ADMIN_EMAIL    = 'admin@chief-supplies.id';
const ADMIN_PASSWORD = 'Admin@12345';
// ===========================================

const userSchema = new mongoose.Schema({
  name:       String,
  email:      { type: String, unique: true, lowercase: true },
  password:   { type: String, select: false },
  role:       { type: String, enum: ['admin', 'customer'], default: 'customer' },
  face_shape: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

console.log('🔌 Menghubungkan ke MongoDB...');
await mongoose.connect(MONGODB_URI);

const existing = await User.findOne({ email: ADMIN_EMAIL });
if (existing) {
  console.log(`⚠️  User dengan email "${ADMIN_EMAIL}" sudah ada.`);
  await mongoose.disconnect();
  process.exit(0);
}

const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: hashedPassword, role: 'admin' });

console.log('');
console.log('✅ Admin berhasil dibuat!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`   Email    : ${ADMIN_EMAIL}`);
console.log(`   Password : ${ADMIN_PASSWORD}`);
console.log(`   Role     : admin`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('👉 Login di: http://localhost:3000/login');

await mongoose.disconnect();
