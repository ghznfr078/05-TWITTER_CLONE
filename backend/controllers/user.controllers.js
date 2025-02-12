import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

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

const getSuggestedUsers = async (req, res) => {};

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

const updateUserProfile = async (req, res) => {};

export {
  getUserProfile,
  getSuggestedUsers,
  followUnfollowUser,
  updateUserProfile,
};
