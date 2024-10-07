import express from "express";
import {
  commentOnPost,
  createPost,
  deletePost,
  getAllPosts,
  getFollowingPosts,
  getLikedPosts,
  getUserPosts,
  likeOrUnlikePost,
} from "../controllers/post.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.get("/all", isAuthenticated, getAllPosts);
router.get("/following", isAuthenticated, getFollowingPosts);
router.get("/user/:username", isAuthenticated, getUserPosts);
router.get("/likes/:id", isAuthenticated, getLikedPosts);
router.post("/create", isAuthenticated, createPost);
router.post("/like/:id", isAuthenticated, likeOrUnlikePost);
router.post("/comment/:id", isAuthenticated, commentOnPost);
router.delete("/:id", isAuthenticated, deletePost);

export default router;
