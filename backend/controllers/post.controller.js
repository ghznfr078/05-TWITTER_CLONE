import uploadOnCloudinary from "../config/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select("fullName username");

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
      owner: user,
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

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "You are not authenticated to like this post!",
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "Post not found!",
      });
    }

    let message = "";
    if (!post.likes.includes(user._id)) {
      await Post.findByIdAndUpdate(id, { $push: { likes: user._id } });
      message = "You liked the post";
    } else {
      await Post.findByIdAndUpdate(id, { $pull: { likes: user._id } });
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

const commentPost = async (req, res) => {};

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

    if (post.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post!",
      });
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

export { createPost, likeUnlikePost, commentPost, deletePost };
