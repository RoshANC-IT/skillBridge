import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URL;
if (!uri) {
  console.error('❌ MONGODB_URL not set in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(uri, {});
    console.log('✅ Connected to MongoDB');
    const dbName = mongoose.connection.name;
    await mongoose.connection.db.dropDatabase();
    console.log(`🗑️  Dropped database '${dbName}' – all collections removed.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  }
})();
