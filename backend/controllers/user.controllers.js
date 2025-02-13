import uploadOnCloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";

const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile fetched!",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );

    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    return res.status(200).json({
      success: true,
      message: "Suggested users fetched!",
      suggestedUsers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToModify || !currentUser) {
      return res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }

    if (userToModify._id.equals(currentUser._id)) {
      return res.status(400).json({
        success: false,
        message: "You can't follow/unfollow yourself!",
      });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // unfollow the user
      await User.updateOne({ _id: id }, { $pull: { followers: req.user._id } });
      await User.updateOne({ _id: req.user._id }, { $pull: { following: id } });

      // TODO: return the id of user as a response
      return res.status(200).json({
        success: true,
        message: "User unfollowed successfully!",
      });
    } else {
      // follow the user
      await User.updateOne({ _id: id }, { $push: { followers: req.user._id } });
      await User.updateOne({ _id: req.user._id }, { $push: { following: id } });

      // send notification of follow
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: id,
      });

      await newNotification.save();

      // TODO: return the id of user as a response
      return res.status(200).json({
        success: true,
        message: "User followed successfully!",
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUserProfile = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;

  const profileImage = req.files?.profileImage?.[0]; // Access the first file from multer
  const coverImage = req.files?.coverImage?.[0]; // Access the first file from multer

  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    // Validate email format and uniqueness
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format!" });
      }

      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ success: false, message: "Email is already in use!" });
        }
      }
      user.email = email;
    }

    // Validate username uniqueness
    if (username && username !== user.username) {
      const normalizedUsername = username.trim().toLowerCase();
      const existingUser = await User.findOne({ username: normalizedUsername });

      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Username is already taken!" });
      }

      user.username = normalizedUsername;
    }

    // Validate password update
    if (
      (newPassword && !currentPassword) ||
      (!newPassword && currentPassword)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current and new passwords!",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect old password!" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long!",
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Upload profile image if provided
    if (profileImage) {
      try {
        if (user.profileImage) {
          const publicId = user.profileImage.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
        const profileImageUrl = await uploadOnCloudinary(profileImage); // Wait for upload to complete
        user.profileImage = profileImageUrl; // Update the user's profile image URL
      } catch (error) {
        return res
          .status(500)
          .json({ success: false, message: "Profile image upload failed!" });
      }
    }

    // Upload cover image if provided
    if (coverImage) {
      try {
        if (user.coverImage) {
          const publicId = user.coverImage.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
        const coverImageUrl = await uploadOnCloudinary(coverImage); // Wait for upload to complete
        user.coverImage = coverImageUrl; // Update the user's cover image URL
      } catch (error) {
        return res
          .status(500)
          .json({ success: false, message: "Cover image upload failed!" });
      }
    }

    // Update other fields
    user.fullName = fullName || user.fullName;
    // user.username = username || user.username;
    // user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully!",
      user: { ...updatedUser._doc, password: undefined },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getUserProfile,
  getSuggestedUsers,
  followUnfollowUser,
  updateUserProfile,
};
