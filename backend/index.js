import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import { v2 as cloudinary } from "cloudinary";

const app = express();

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// import routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  connectDB();
  console.log("Server is running on port: ", port);
});
