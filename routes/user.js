import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  followOrUnfollowUser,
  getSuggestedUsers,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.js";

const router = express.Router();

router.get("/profile/:username", isAuthenticated, getUserProfile);
router.get("/suggested", isAuthenticated, getSuggestedUsers);
router.post("/follow/:id", isAuthenticated, followOrUnfollowUser);
router.patch("/update", isAuthenticated, updateUserProfile);
// router.delete("", isAuthenticated, async (req, res) => {});

export default router;
