import express from "express";
import {
  login,
  logout,
  signUp,
  getMe,
} from "../controllers/auth.controllers.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);

export default router;
