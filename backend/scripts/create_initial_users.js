import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URL;
if (!uri) {
  console.error('❌ MONGODB_URL not set');
  process.exit(1);
}

const usersToCreate = [
  {
    firstName: 'Admin',
    lastName: 'User',
    userName: 'admin',
    email: 'admin@sb.com',
    role: 'admin',
    password: 'Password',
  },
  {
    firstName: 'Employer',
    lastName: 'One',
    userName: 'emp1',
    email: 'emp1@sb.com',
    role: 'employer',
    password: 'Password',
  },
  {
    firstName: 'Worker',
    lastName: 'One',
    userName: 'wrk1',
    email: 'wrk1@sb.com',
    role: 'worker',
    password: 'Password',
  },
];

(async () => {
  try {
    await mongoose.connect(uri, {});
    console.log('✅ Connected to MongoDB');

    for (const u of usersToCreate) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`⚠️  User ${u.email} already exists – skipping`);
        continue;
      }
      const hashed = await bcrypt.hash(u.password, 10);
      const newUser = new User({
        firstName: u.firstName,
        lastName: u.lastName,
        userName: u.userName,
        email: u.email,
        password: hashed,
        role: u.role,
        status: 'active',
      });
      await newUser.save();
      console.log(`✅ Created ${u.role} user: ${u.email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating users:', err);
    process.exit(1);
  }
})();
