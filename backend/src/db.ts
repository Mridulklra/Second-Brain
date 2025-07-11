import mongoose, { model, Schema } from "mongoose";
import { MONGO_URL } from "./config";

// ✅ Connect to MongoDB with proper logs
mongoose.connect(MONGO_URL)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit if DB not connected
  });


// ------------------ Models ------------------ //

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: { type: String }
});

export const UserModel = model("User", UserSchema);


const ContentSchema = new Schema({
  title: { type: String },
  text: String,
  link: { type: String },
  type: { type: String },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true }
});

export const ContentModel = model("Content", ContentSchema);


const LinkSchema = new Schema({
  hash: String,
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true }
});

export const LinkModel = model("Links", LinkSchema);
