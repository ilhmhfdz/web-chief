const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

const URI = process.env.MONGODB_URI;
if (!URI) { console.error('❌ MONGODB_URI not found'); process.exit(1); }

mongoose.connect(URI).then(async function() {
  const db = mongoose.connection.db;

  // Migrate users
  const users = db.collection('users');
  const r1 = await users.updateMany(
    { ai_credits: { $exists: false } },
    { $set: { ai_credits: 1, ai_credits_used_total: 0 } }
  );
  console.log('✅ Users migrated:', r1.modifiedCount, '(ai_credits = 1)');

  // Migrate orders
  const orders = db.collection('orders');
  const r2 = await orders.updateMany(
    { ai_credit_granted: { $exists: false } },
    { $set: { ai_credit_granted: false } }
  );
  console.log('✅ Orders migrated:', r2.modifiedCount, '(ai_credit_granted = false)');

  // Verify
  const total = await users.countDocuments({ ai_credits: { $exists: true } });
  console.log('\n📊 Total users with ai_credits field:', total);

  await mongoose.disconnect();
  console.log('✅ Migration complete!');
  process.exit(0);
}).catch(function(e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
