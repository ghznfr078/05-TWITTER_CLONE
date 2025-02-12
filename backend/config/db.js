import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongodb connected with: ", db.connection.host);
  } catch (error) {
    console.log("Error while connecting DB: ", error);
  }
};

export default connectDB;
