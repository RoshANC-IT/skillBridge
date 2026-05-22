import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Validate MongoDB URL is set
    if (!process.env.MONGODB_URL) {
      throw new Error('MONGODB_URL environment variable is not set');
    }

    // Log connection attempt (without credentials)
    const urlForLogging = process.env.MONGODB_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`🔌 Connecting to MongoDB...`);
    console.log(`   URL: ${urlForLogging}`);

    // Set connection options
    const options = {
      // Remove deprecated options and use recommended ones
    };

    await mongoose.connect(process.env.MONGODB_URL, options);
    
    console.log("✅ MongoDB Connected Successfully");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (error) {
    console.error("❌ Database Connection Error:");
    console.error(`   Error: ${error.message}`);
    
    if (error.name === 'MongoServerError') {
      console.error("   This is a MongoDB server error. Check:");
      console.error("   - Is MongoDB running?");
      console.error("   - Is the connection string correct?");
      console.error("   - Are credentials valid?");
    } else if (error.name === 'MongooseError') {
      console.error("   This is a Mongoose error. Check:");
      console.error("   - Is the MONGODB_URL format correct?");
      console.error("   - Is the database accessible?");
    }
    
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Verify MongoDB is running: mongosh or mongo");
    console.error("   2. Check your .env file has MONGODB_URL set");
    console.error("   3. Verify the connection string format");
    console.error("   4. Check network/firewall settings\n");
    
    // Exit process if database connection fails
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

export default connectDB;
