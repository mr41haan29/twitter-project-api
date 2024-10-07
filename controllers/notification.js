import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.js";
import Post from "../models/post.js";
import Notification from "../models/notification.js";

export async function getNotifications(req, res) {
  try {
    const currentUserId = req.user._id;
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }

    const notifications = await Notification.find({
      to: currentUserId,
    }).populate({
      path: "from",
      select: "username profileImage",
    });

    if (!notifications) {
      return res.status(400).json({ message: "no notifications" });
    } else {
      await Notification.updateMany({ to: currentUserId }, { read: true });

      return res.status(200).json(notifications);
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}
export async function deleteNotifications(req, res) {
  try {
    const currentUserId = req.user._id;
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }

    await Notification.deleteMany({
      to: currentUserId,
    });

    return res.status(200).json({ message: "notifications deleted" });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
