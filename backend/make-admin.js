import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import User from "./models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const emailArg = process.argv[2];

if (!emailArg) {
  console.log("Usage: node make-admin.js <user-email>");
  process.exit(1);
}

const run = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URL);
    
    console.log(`Looking for user with email: ${emailArg}`);
    let user = await User.findOne({ email: emailArg });
    
    if (!user) {
      console.log("User not found... creating new admin account!");
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.default.hash("Password", 10);
      
      user = await User.create({
        firstName: "System",
        lastName: "Admin",
        userName: emailArg.split('@')[0],
        email: emailArg,
        password: hashedPassword,
        role: "admin",
        status: "active"
      });
      console.log(`Created new Admin account: ${emailArg} / Password`);
    } else {
      user.role = "admin";
      await user.save();
      console.log(`Successfully upgraded ${user.firstName} ${user.lastName} (${emailArg}) to Admin!`);
    }
    
    console.log("They can now log in and access the Admin Dashboard (/admin-dashboard.html)");
    
  } catch (error) {
    console.error("Error upgrading user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
