import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import connectDB from "./config/db.js";
import { setMaxListeners } from "events";
import { Server } from "socket.io";
import http from "http";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/health.routes.js";
import employerRoutes from "./routes/employer.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import messageRoutes from "./routes/message.routes.js";
import servicesRoutes from "./routes/services.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import chatRoutes from "./routes/chat.routes.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables with explicit path resolution
// This ensures dotenv works consistently across different editors and environments
dotenv.config({ path: join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Please create a .env file based on .env.example');
  console.error('   Make sure to set all required variables.\n');
  process.exit(1);
}

setMaxListeners(20);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.locals.port = port;

// Validate port number
if (isNaN(port) || port < 1 || port > 65535) {
  console.error(`❌ Invalid PORT value: ${process.env.PORT}`);
  console.error('   PORT must be a number between 1 and 65535');
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser());
// CORS configuration from environment or defaults
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:5500", "http://localhost:5501", "http://127.0.0.1:5500", "http://127.0.0.1:5501", "http://localhost:3000", "http://127.0.0.1:3000"];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? corsOrigins : [...corsOrigins, "file://", "*"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Create HTTP server
const server = http.createServer(app);

// Socket.IO configuration from environment or defaults
const socketOrigins = process.env.SOCKET_IO_ORIGINS
  ? process.env.SOCKET_IO_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:5500", "http://localhost:5501", "http://127.0.0.1:5500", "http://127.0.0.1:5501", "http://localhost:3000", "http://127.0.0.1:3000"];

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: socketOrigins,
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      socket.emit("registered", userId.toString());
    }
  });

  socket.on("disconnect", () => {});
});

// Routes
app.use("/api", healthRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/chat", chatRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);


// Start server
server.listen(port, () => {
  console.log("=".repeat(50));
  console.log("🚀 Skill Bridge Backend Server");
  console.log("=".repeat(50));
  console.log(`📍 Server running on port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${port}/api`);
  console.log(`📊 Health Check: http://localhost:${port}/api/health`);
  console.log("=".repeat(50));
  
  // Connect to database
  connectDB();
});
