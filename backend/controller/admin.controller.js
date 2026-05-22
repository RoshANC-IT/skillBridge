import User from "../models/user.model.js";
import Booking from "../models/booking.model.js";
import Job from "../models/job.model.js";

// @desc    Get all users (workers and employers)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Ban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot ban an admin user" });
    }

    user.status = "banned";
    await user.save();
    
    res.status(200).json({ message: "User banned successfully", user });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Unban a user
// @route   PUT /api/admin/users/:id/unban
// @access  Private/Admin
export const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = "active";
    await user.save();
    
    res.status(200).json({ message: "User unbanned successfully", user });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete (cancel) a user completely
// @route   DELETE /api/admin/users/:id/cancel
// @access  Private/Admin
export const cancelUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a user's role (Main Admin Only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin (Main Admin specific)
export const updateRole = async (req, res) => {
  try {
    if (req.user.email !== "admin@sb.com") {
      return res.status(403).json({ message: "Only the Main Admin can modify roles." });
    }

    const { role } = req.body;
    if (!["admin", "worker", "employer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.email === "admin@sb.com") {
      return res.status(403).json({ message: "Cannot modify the Main Admin's role." });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user details (personal info, current work, history)
// @route   GET /api/admin/users/:id/details
// @access  Private/Admin
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch related bookings
    const roleQuery = user.role === "worker" ? { worker: user._id } : { employer: user._id };
    const bookings = await Booking.find(roleQuery).sort({ createdAt: -1 });

    // Separate active vs history
    const activeStatus = ["pending", "confirmed", "in-progress"];
    const historyStatus = ["completed", "cancelled"];

    const currentWork = bookings.filter(b => activeStatus.includes(b.status));
    const history = bookings.filter(b => historyStatus.includes(b.status));

    // Also bring in Job if it's an employer or if they applied/assigned
    let activeJobs = [];
    let pastJobs = [];
    if (user.role === "employer") {
      const jobs = await Job.find({ employer: user._id });
      activeJobs = jobs.filter(j => ["open", "assigned", "in-progress", "paused"].includes(j.status));
      pastJobs = jobs.filter(j => ["completed", "closed"].includes(j.status));
    }

    let financialTotal = 0;
    history.forEach(b => {
      if (b.status === "completed" && b.price) {
        financialTotal += Number(b.price);
      }
    });
    pastJobs.forEach(j => {
      if (j.status === "completed" && (j.pay || j.salary)) {
        financialTotal += Number(j.pay || j.salary);
      }
    });

    res.status(200).json({
      user,
      currentWork: [...currentWork, ...activeJobs],
      history: [...history, ...pastJobs],
      financialTotal
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Grant Admin Access by Email
// @route   POST /api/admin/grant-access
// @access  Private/Admin (Main Admin specific)
export const grantAdminAccess = async (req, res) => {
  try {
    if (req.user.email !== "admin@sb.com") {
      return res.status(403).json({ message: "Only Main Admin can grant access" });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    let user = await User.findOne({ email });
    if (!user) {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.default.hash("admin123", 10);
      user = await User.create({
        firstName: "System",
        lastName: "Admin",
        userName: email.split('@')[0],
        email: email,
        password: hashedPassword,
        role: "admin",
        status: "active"
      });
      return res.status(201).json({ message: "Created new admin account", user });
    } else {
      user.role = "admin";
      await user.save();
      return res.status(200).json({ message: "Upgraded existing user to admin", user });
    }
  } catch (err) {
    console.error("Error granting admin:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Revoke Admin Access 
// @route   POST /api/admin/revoke-access
// @access  Private/Admin (Main Admin specific)
export const revokeAdminAccess = async (req, res) => {
  try {
    if (req.user.email !== "admin@sb.com") {
      return res.status(403).json({ message: "Only Main Admin can revoke access" });
    }

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.email === "admin@sb.com") {
      return res.status(403).json({ message: "Cannot revoke Main Admin" });
    }

    user.role = "worker"; // default downgrade
    await user.save();
    return res.status(200).json({ message: "Revoked admin access", user });
  } catch (err) {
    console.error("Error revoking admin:", err);
    res.status(500).json({ message: "Server error" });
  }
};
