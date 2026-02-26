import { v2 as cloudinary } from "cloudinary";

// 🔍 Debug env values (safe)
console.log("☁️ Cloudinary ENV Check:");
console.log("➡️ CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "❌ MISSING");
console.log(
  "➡️ CLOUDINARY_API_KEY:",
  process.env.CLOUDINARY_API_KEY ? "✅ LOADED" : "❌ MISSING"
);
console.log(
  "➡️ CLOUDINARY_API_SECRET:",
  process.env.CLOUDINARY_API_SECRET ? "✅ LOADED" : "❌ MISSING"
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;