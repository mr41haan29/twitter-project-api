import express from "express";

import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  deleteNotifications,
  getNotifications,
} from "../controllers/notification.js";

const router = express.Router();

router.get("/", isAuthenticated, getNotifications);
router.delete("/", isAuthenticated, deleteNotifications);

export default router;
