import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// import routes
import authRouter from "./routes/auth.routes.js";
app.use("/api/auth", authRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  connectDB();
  console.log("Server is running on port: ", port);
});
