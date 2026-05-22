import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URL;
if (!uri) { console.error('❌ MONGODB_URL not set'); process.exit(1); }

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@sb.com';
    const newPassword = 'Password';

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.role = 'admin';
    user.status = 'active';
    await user.save();

    console.log(`✅ Password reset for ${email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`   Role: ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
