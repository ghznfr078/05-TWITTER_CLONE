import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import upload from "../config/multer.js";
import {
  commentPost,
  createPost,
  deletePost,
  likeUnlikePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.post("/create", protectRoute, upload.array("images"), createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentPost);
router.delete("/:id", protectRoute, deletePost);

export default router;
