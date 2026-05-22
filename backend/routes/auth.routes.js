import express from "express";
import { signUp, login, logout, verify, updateProfile } from "../controller/auth.controller.js";
import { sendOtp, verifyOtp } from "../controller/otp.controller.js";
import { uploadAadhaar } from "../controller/aadhaar.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router(); // ✅ This line was missing

const upload = multer({ dest: "uploads/" });

// Auth routes
router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", authMiddleware, verify); // Verify token endpoint
router.put("/profile", authMiddleware, updateProfile); // Update profile endpoint

// OTP routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Aadhaar upload route
router.post("/upload-aadhaar", upload.single("aadhaarImage"), uploadAadhaar);

export default router;
