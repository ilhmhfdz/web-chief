const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.collection('products').find({}).toArray();
  console.log("Products:", products.map(p => ({name: p.name, slug: p.slug})));
  process.exit(0);
}
run();
