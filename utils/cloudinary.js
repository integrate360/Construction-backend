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







// PORT=5000
// NODE_ENV=development
// MONGO_URI=mongodb+srv://anjalgold44:ANJAL12345@cluster0.cjqnjuw.mongodb.net/Construction?retryWrites=true&w=majority
// JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_complex
// JWT_EXPIRE=30d
// BCRYPT_SALT_ROUNDS=10
// CLIENT_URL=http://localhost:3000
// RATE_LIMIT_WINDOW_MS=900000 
// RATE_LIMIT_MAX_REQUESTS=100
// CLOUDINARY_CLOUD_NAME=dujunrfjh
// CLOUDINARY_API_KEY=181486236153331
// CLOUDINARY_API_SECRET=l5cDTpMQNqe5lhzA0y90b8vxYsk