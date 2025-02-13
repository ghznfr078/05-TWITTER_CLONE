const url =
  "https://res.cloudinary.com/myapp/image/upload/v1701234567/profile_pictures/user1234.png";

console.log(url.split("/").pop().split(".")[0]);
