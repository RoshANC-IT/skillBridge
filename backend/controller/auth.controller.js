import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateToken } from "../config/token.js"
import jwt from "jsonwebtoken";




export const signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password, userName, role, workerType, city, phoneNumber } = req.body;
    
    // Enhanced logging for signup attempts
    console.log("=".repeat(50));
    console.log("📝 SIGNUP REQUEST");
    console.log("=".repeat(50));
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Role: ${role || 'NOT PROVIDED'}`);
    console.log(`   Email: ${email || 'NOT PROVIDED'}`);
    console.log(`   Username: ${userName || 'NOT PROVIDED'}`);
    console.log("=".repeat(50));

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !userName || !role) {
      console.error("❌ Signup failed: Missing required fields");
      console.error(`   Missing: ${[
        !firstName && 'firstName',
        !lastName && 'lastName',
        !email && 'email',
        !password && 'password',
        !userName && 'userName',
        !role && 'role'
      ].filter(Boolean).join(', ')}`);
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate role-specific fields
    if (role === "worker") {
      if (!workerType || !city || !phoneNumber) {
        console.error("❌ Signup failed: Worker missing required fields");
        console.error(`   Missing: ${[
          !workerType && 'workerType',
          !city && 'city',
          !phoneNumber && 'phoneNumber'
        ].filter(Boolean).join(', ')}`);
        return res.status(400).json({ message: "Worker type, city, and phone number are required for workers" });
      }
    } else if (role === "employer") {
      if (!city) {
        console.error("❌ Signup failed: Employer missing city");
        return res.status(400).json({ message: "City is required for employers" });
      }
    }

    // Check if user already exists
    let existUser = await User.findOne({ email: email });
    if (existUser) {
      console.error(`❌ Signup failed: User already exists with email: ${email}`);
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Check if phone number already exists (for workers)
    if (role === "worker" && phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        console.error(`❌ Signup failed: Phone number already registered: ${phoneNumber}`);
        return res.status(400).json({ message: "Phone number already registered" });
      }
    }

    // Validate password
    if (!password || typeof password !== "string") {
      console.error("❌ Signup failed: Invalid password");
      return res.status(400).json({ message: "Password is required and must be a string" });
    }

    if (password.length < 6) {
      console.error("❌ Signup failed: Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user object
    const userData = {
        firstName,
        lastName,
        email,
        password:hashedPassword,
        userName,
        role
    };

    // Add role-specific fields
    if (role === "worker") {
      userData.workerType = workerType;
      userData.city = city;
      userData.phoneNumber = phoneNumber;
    } else if (role === "employer") {
      userData.city = city;
    }

      const user=await User.create(userData)
      

      const token = generateToken(user._id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Build response user object
      const userResponse = { 
        id: user._id, 
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
        role: user.role,
        availability: user.availability,
        avatarUrl: user.avatarUrl
      };

      // Add role-specific fields to response
      if (user.city) {
        userResponse.city = user.city;
      }
      
      if (role === "worker") {
        userResponse.workerType = user.workerType;
        userResponse.phoneNumber = user.phoneNumber;
      }

    console.log(`✅ Signup successful: ${userResponse.email} (${role})`);
    console.log(`   User ID: ${user._id}`);
    console.log("=".repeat(50));

    return res.status(201).json({
      token,
      user: userResponse
    });
  } catch (error) {
    // Enhanced error logging
    console.error("=".repeat(50));
    console.error("❌ SIGNUP ERROR");
    console.error("=".repeat(50));
    console.error(`   Time: ${new Date().toISOString()}`);
    console.error(`   Error Type: ${error.name || 'Unknown'}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error("=".repeat(50));

    // Return appropriate error response
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    
    return res.status(500).json({ 
      message: "Internal server error during signup",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Enhanced logging for login attempts
    console.log("=".repeat(50));
    console.log("🔐 LOGIN REQUEST");
    console.log("=".repeat(50));
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Email: ${email || 'NOT PROVIDED'}`);
    console.log("=".repeat(50));

    // Validate required fields
    if (!email || !password) {
      console.error("❌ Login failed: Missing required fields");
      console.error(`   Missing: ${[
        !email && 'email',
        !password && 'password'
      ].filter(Boolean).join(', ')}`);
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.error(`❌ Login failed: User not found - Email: ${email}`);
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error(`❌ Login failed: Invalid password for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }


    const { role } = user;

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    user.password = undefined;

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      // Build response user object
      const userResponse = {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        userName: user.userName,
        profileName: user.profileName,
        availability: user.availability,
        avatarUrl: user.avatarUrl,
        status: user.status || "active",
      };

      // Add city to response if available
      if (user.city) {
        userResponse.city = user.city;
      }

      // Add worker-specific fields to response if role is worker
      if (user.role === "worker") {
        userResponse.workerType = user.workerType;
        userResponse.phoneNumber = user.phoneNumber;
      }

      res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .status(200)
      .json({
        token,
        user: userResponse
      });

    console.log(`✅ Login successful: ${userResponse.email} (${role})`);
    console.log(`   User ID: ${user._id}`);
    console.log("=".repeat(50));
  } catch (error) {
    // Enhanced error logging
    console.error("=".repeat(50));
    console.error("❌ LOGIN ERROR");
    console.error("=".repeat(50));
    console.error(`   Time: ${new Date().toISOString()}`);
    console.error(`   Email: ${req.body?.email || 'NOT PROVIDED'}`);
    console.error(`   Error Type: ${error.name || 'Unknown'}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error("=".repeat(50));

    // Return appropriate error response
    return res.status(500).json({ 
      message: "Internal server error during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const logout=async (req,res)=>{
  try {
    res.clearCookie("token")
    res.status(200).json({message:"User Logout"})
  } catch (error) {
    return res.status(400).json(error)
    
  }
}

// Verify token and return user
export const verify = async (req, res) => {
  try {
    // User is already attached by authMiddleware
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch full user data
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build response user object
    const userResponse = {
      _id: user._id,
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      userName: user.userName,
      profileName: user.profileName,
      availability: user.availability,
      avatarUrl: user.avatarUrl,
      status: user.status || "active",
    };

    // Add city if available
    if (user.city) {
      userResponse.city = user.city;
    }

    // Add worker-specific fields if role is worker
    if (user.role === "worker") {
      userResponse.workerType = user.workerType;
      userResponse.phoneNumber = user.phoneNumber;
    }

    return res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update user profile (universal for both workers and employers)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      firstName,
      lastName,
      userName,
      phoneNumber,
      city,
      profileName,
      workerType,
      address,
      bio,
      experience,
      hourlyRate,
      availability,
    } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update allowed fields
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (userName !== undefined) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        userName, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updateData.userName = userName;
    }
    if (phoneNumber !== undefined) {
      // Check if phone number is already taken by another user
      if (phoneNumber) {
        const existingPhone = await User.findOne({ 
          phoneNumber, 
          _id: { $ne: userId } 
        });
        if (existingPhone) {
          return res.status(400).json({ message: "Phone number already registered" });
        }
      }
      updateData.phoneNumber = phoneNumber || undefined;
    }
    if (city !== undefined) updateData.city = city || undefined;
    if (profileName !== undefined) updateData.profileName = profileName || undefined;
    if (address !== undefined) updateData.address = address || undefined;
    if (bio !== undefined) updateData.bio = bio || undefined;
    if (experience !== undefined) updateData.experience = experience || undefined;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate || undefined;
    
    // Worker-specific fields
    if (user.role === "worker" && workerType !== undefined) {
      updateData.workerType = workerType || undefined;
    }
    if (user.role === "worker" && availability !== undefined) {
      updateData.availability = availability;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Build response user object
    const userResponse = {
      _id: updatedUser._id,
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      userName: updatedUser.userName,
      profileName: updatedUser.profileName,
      availability: updatedUser.availability,
      avatarUrl: updatedUser.avatarUrl,
      address: updatedUser.address,
      bio: updatedUser.bio,
      experience: updatedUser.experience,
      hourlyRate: updatedUser.hourlyRate,
    };

    // Add city if available
    if (updatedUser.city) {
      userResponse.city = updatedUser.city;
    }

    // Add worker-specific fields if role is worker
    if (updatedUser.role === "worker") {
      userResponse.workerType = updatedUser.workerType;
      userResponse.phoneNumber = updatedUser.phoneNumber;
    }

    return res.status(200).json({ 
      message: "Profile updated successfully",
      user: userResponse 
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
};


