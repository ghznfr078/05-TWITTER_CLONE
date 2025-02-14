import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uploadOnCloudinary from "../config/cloudinary.js";

// generate Token

const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie("token", token, options);
};

const signUp = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    console.log(username);

    const profileImage = req.files?.profileImage?.[0];
    const coverImage = req.files?.coverImage?.[0];

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format!",
      });
    }

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required!",
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "username already taken!",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "email already taken!",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be 6 characters long!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    // upload images
    if (profileImage) {
      const profileImageUrl = await uploadOnCloudinary(profileImage);
      newUser.profileImage = profileImageUrl;
    }

    if (coverImage) {
      const coverImageUrl = await uploadOnCloudinary(coverImage);
      newUser.coverImage = coverImageUrl;
    }

    generateTokenAndSetCookie(res, newUser._id);
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Your account has been created!",
      user: {
        ...newUser._doc,
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Not found. Register first!",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.cookie("token", "", { maxAge: 0 });
    return res.status(200).json({
      success: true,
      message: "Logout successful!",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export { signUp, login, logout, getMe };
