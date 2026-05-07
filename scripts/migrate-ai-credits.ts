/**
 * One-time migration script: Add ai_credits fields to existing users.
 * Run with: npx ts-node scripts/migrate-ai-credits.ts
 *
 * This sets ai_credits = 1 and ai_credits_used_total = 0
 * for all users that don't have these fields yet.
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually (no dotenv dependency needed)
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});


const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function migrate() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db!;
  const usersCollection = db.collection('users');

  // Find users missing ai_credits field
  const missing = await usersCollection.countDocuments({ ai_credits: { $exists: false } });
  console.log(`📊 Found ${missing} user(s) without ai_credits field`);

  if (missing === 0) {
    console.log('✅ All users already have ai_credits. Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  // Atomic update — set default values for missing fields only
  const result = await usersCollection.updateMany(
    { ai_credits: { $exists: false } },
    {
      $set: {
        ai_credits: 1,
        ai_credits_used_total: 0,
      },
    }
  );

  console.log(`\n✅ Migration complete!`);
  console.log(`   Modified: ${result.modifiedCount} user(s)`);
  console.log(`   Each user now has 1 free AI credit.\n`);

  // Also fix orders missing ai_credit_granted
  const ordersCollection = db.collection('orders');
  const ordersMissing = await ordersCollection.countDocuments({ ai_credit_granted: { $exists: false } });
  
  if (ordersMissing > 0) {
    const ordersResult = await ordersCollection.updateMany(
      { ai_credit_granted: { $exists: false } },
      { $set: { ai_credit_granted: false } }
    );
    console.log(`✅ Orders migration: ${ordersResult.modifiedCount} order(s) updated with ai_credit_granted = false`);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Migration done!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
