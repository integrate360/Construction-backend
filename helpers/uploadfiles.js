import cloudinary from "../utils/cloudinary.js";

export const uploadSelfie = async (req, res, next) => {
  try {
    // ✅ multer puts file here
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Selfie image file is required",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "attendance/selfies",
    });

    // ✅ attach cloudinary url
    req.selfieImageUrl = result.secure_url;

    next(); // 🔥 VERY IMPORTANT
  } catch (error) {
    console.error("🔥 Cloudinary Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Selfie upload failed",
    });
  }
};