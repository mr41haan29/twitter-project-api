import bcrypt from "bcryptjs";
import Notification from "../models/notification.js";
import User from "../models/user.js";

import { v2 as cloudinary } from "cloudinary";

export async function getUserProfile(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).select("-password");

    if (!user) return res.status(400).json({ error: "user not found" });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function getSuggestedUsers(req, res) {
  //from all the users currently in DB, give a list of 4 users from a sample of 10 users to follow exlcuding myself and the people I already follow
  try {
    const currentUserId = req.user._id;

    const usersFollowedByMe = await User.findById(currentUserId).select(
      "following"
    );

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: currentUserId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );

    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => {
      user.password = null;
    });

    return res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}

export async function followOrUnfollowUser(req, res) {
  //if current user is already following the user, this function will unfollow them
  //if current user is not already following the user, this function will follow them

  try {
    const { id } = req.params;

    //we get the current user from the req.user object that was set when the user was authenticated
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: "you cannot follow yourself" });
    }

    const userToFollow = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
      return res.status(400).json({ error: "user not found" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      //unfollow
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      //TODO: return the id of the user as a response
      res.status(200).json({
        message: `${currentUser.username} unfollowed ${userToFollow.username}`,
      });
    } else {
      //follow
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      //notification

      const newNotification = await Notification.create({
        type: "follow",
        from: currentUser._id,
        to: userToFollow._id,
      });

      //TODO: return the id of the user as a response
      res.status(200).json({
        message: `${currentUser.username} followed ${userToFollow.username}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const { username, currentPassword, newPassword, email, profileImage } =
      req.body;

    const currentUserId = req.user._id;

    let user = await User.findById(currentUserId);

    if (!user) return res.status(400).json({ error: "user not found" });

    //updating password
    if (
      (!currentPassword && newPassword) ||
      (!newPassword && currentPassword)
    ) {
      return res
        .status(400)
        .json({ error: "please provide current password and new password " });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "incorrect password" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "new password must be atleast 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    //updating profile pic
    if (profileImage) {
      if (user.profileImage) {
        await cloudinary.uploader.destroy(
          user.profileImage.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudinary.uploader.upload(profileImage);

      profileImage = uploadedResponse.secure_url;
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.profileImage = profileImage || user.profileImage;

    user = await user.save();

    //this doesn't update the DB, just sets the password field to be null in the response
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}

export async function deleteUser(req, res) {}
