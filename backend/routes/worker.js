// Not Used File ,for future references only   
// const express = require("express");
// const router = express.Router();
// const { verifyToken } = require("../middleware/auth");
// const Worker = require("../models/Worker");

// // ✅ Update profile
// router.put("/update-profile/:id", verifyToken, async (req, res) => {
//   try {
//     const updated = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update profile" });
//   }
// });

// module.exports = router;
