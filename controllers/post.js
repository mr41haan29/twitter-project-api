import { v2 as cloudinary } from "cloudinary";

import User from "../models/user.js";
import Post from "../models/post.js";
import Notification from "../models/notification.js";

export async function getAllPosts(req, res) {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });
    if (posts.length === 0) {
      return res.status(200).json({ message: "no posts" });
    }

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function createPost(req, res) {
  try {
    const { text } = req.body;

    //the variable will be reassigned, so it can't be a const
    let { image } = req.body;

    const currentUserId = req.user._id.toString();

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }

    if (!text && !image) {
      return res.status(400).json({ error: "post must have image or text" });
    }

    //upload it to cloudinary
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image);
      image = uploadedResponse.secure_url;
    }

    const newPost = await Post.create({
      text: text,
      image: image,
      user: currentUserId,
    });

    return res.status(200).json(newPost);
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function likeOrUnlikePost(req, res) {
  //if current user has already liked the post, this function will unlike it
  //if current user has not already liked the post, this function will like it

  try {
    const { id } = req.params; //post id

    const currentUser = await User.findById(req.user._id);

    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({ error: "post not found" });
    }

    if (!currentUser) {
      return res.status(400).json({ error: "user not found" });
    }

    const isPostLiked = post.likes.includes(currentUser._id);

    if (isPostLiked) {
      //unlike post
      await Post.findByIdAndUpdate(id, { $pull: { likes: currentUser._id } });
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { likedPosts: id },
      });

      //TODO: return the id of the user as a response
      return res.status(200).json({
        message: `${currentUser.username} unliked post: ${post.text}`,
      });
    } else {
      //like post
      await Post.findByIdAndUpdate(id, { $push: { likes: currentUser._id } });
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { likedPosts: id },
      });

      //notification
      const newNotification = await Notification.create({
        type: "like",
        from: currentUser._id,
        to: post.user,
      });

      //TODO: return the id of the user as a response
      return res.status(200).json({
        message: `${currentUser.username} liked post: ${post.text}`,
      });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function commentOnPost(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res
        .status(400)
        .json({ error: "please provide text for a comment" });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({ error: "post not found" });
    }

    //comment on the post
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $push: { comments: { user: req.user._id, text: text } },
      },
      { new: true }
    );

    return res.status(200).json(updatedPost);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}

export async function deletePost(req, res) {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({ error: "post not found" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "not authorized to delete this post" });
    }

    const imageURL = post.image;

    if (imageURL) {
      //remove it from cloudinary
      await cloudinary.uploader.destroy(
        imageURL.split("/").pop().split(".")[0]
      );
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({ message: "post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function getLikedPosts(req, res) {
  try {
    const { id } = req.params; //user id
    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }

    //gets the liked posts that of a user
    const likedPosts = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(likedPosts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}

export async function getFollowingPosts(req, res) {
  try {
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(400).json({ error: "user not found" });
    }

    const following = user.following;

    //gets the posts of the people i follow
    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(feedPosts);
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function getUserPosts(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username });

    if (!user) {
      res.status(400).json({ error: "user not found" });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (!posts) {
      res.status(400).json({ error: "posts not found" });
    } else {
      return res.status(200).json(posts);
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}
