import uploadOnCloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }

    let uploadImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadOnCloudinary(file);
        uploadImages.push(imageUrl);
      }
    }

    const post = new Post({
      user: user._id,
      text,
      images: uploadImages,
    });

    await post.save();

    return res.status(200).json({
      success: true,
      message: "You have created a post!",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const { id } = req.params;

    const userId = req.user._id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post not found!",
      });
    }

    let message = "";

    if (!post.likes.includes(userId)) {
      // ✅ Like post
      await Post.updateOne({ _id: id }, { $addToSet: { likes: userId } });
      await User.updateOne({ _id: userId }, { $addToSet: { likedPosts: id } });

      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      message = "You liked the post";
    } else {
      // ✅ Dislike post
      await Post.updateOne({ _id: id }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: id } });

      message = "You disliked the post";
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found!",
      });
    }

    const comment = {
      text,
      user: userId,
    };

    post.comments.push(comment);

    await post.save();

    const notification = new Notification({
      from: userId,
      to: post.user,
      type: "comment",
    });
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "You commented on a post",
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found!",
      });
    }

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post!",
      });
    }

    if (post.images.length > 0) {
      for (const image of post.images) {
        const publicId = image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password -email",
      })
      .populate({
        path: "comments.user",
        select: "-password -email",
      });

    return res.status(200).json({
      success: true,
      message: posts.length > 0 ? "All posts fetched!" : "No post found",
      Total_Posts: posts.length,
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLikedPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "likes.user",
        select: "-password -email",
      })
      .populate({
        path: "comments.user",
        select: "-password -email",
      });

    return res.status(200).json({
      success: true,
      Total_liked_posts: likedPosts.length,
      likedPosts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFollowingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json({
      success: true,
      Total_feed_posts: feedPosts.length,
      feedPosts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
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

    return res.status(500).json({
      success: true,
      Total_posts: posts.length,
      posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createPost,
  likeUnlikePost,
  commentPost,
  deletePost,
  getAllPosts,
  getLikedPosts,
  getFollowingPosts,
  getUserPosts,
};
