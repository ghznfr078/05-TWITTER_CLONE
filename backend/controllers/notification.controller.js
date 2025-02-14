import Notification from "../models/notification.model.js";

const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImage",
    });

    const notifications = await Notification.updateMany(
      { to: userId },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ to: userId });

    return res.status(500).json({
      success: false,
      message: "Notifications deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found!",
      });
    }

    if (notification.to.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this notification!",
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { getNotifications, deleteNotifications, deleteNotification };
