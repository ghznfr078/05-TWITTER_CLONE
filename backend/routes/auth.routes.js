import express from "express";
import {
  login,
  logout,
  signUp,
  getMe,
} from "../controllers/auth.controllers.js";
import protectRoute from "../middlewares/protectRoute.js";
import upload from "../config/multer.js";

const router = express.Router();

router.post(
  "/signup",
  upload.fields([
    {
      name: "profileImage",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  signUp
);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);

export default router;
