import express from "express";
import { getMe, login, logout, register } from "../controllers/auth.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.get("/me", isAuthenticated, getMe);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
