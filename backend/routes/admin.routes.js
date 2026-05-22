import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRole from "../middleware/authorizeRole.js";
import { getAllUsers, banUser, unbanUser, cancelUser, updateRole, getUserDetails, grantAdminAccess, revokeAdminAccess } from "../controller/admin.controller.js";

const router = express.Router();

// All routes here are protected by both authMiddleware and 'admin' role check
router.use(authMiddleware, authorizeRole('admin'));

router.get("/users", getAllUsers);
router.put("/users/:id/ban", banUser);
router.put("/users/:id/unban", unbanUser);
router.put("/users/:id/role", updateRole);
router.get("/users/:id/details", getUserDetails);
router.delete("/users/:id/cancel", cancelUser);

router.post("/grant-access", grantAdminAccess);
router.post("/revoke-access", revokeAdminAccess);

export default router;
