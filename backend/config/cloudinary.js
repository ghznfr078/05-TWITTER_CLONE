import { v2 as cloudinary } from "cloudinary";

const uploadOnCloudinary = async (image) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          reject(new Error("Image upload failed!"));
        } else {
          resolve(result.secure_url); // Return the uploaded image URL
        }
      }
    );

    uploadStream.end(image.buffer);
  });
};

export default uploadOnCloudinary;
