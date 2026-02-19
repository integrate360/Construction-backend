import express from "express";
import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deactivateUser,
  activateUser,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register",authMiddleware, registerUser);
router.post("/login", loginUser);

router.get("/get/me", authMiddleware, getMyProfile);
router.put("/update/me", authMiddleware, updateMyProfile);
router.put("/change-password", authMiddleware, changePassword);

router.get(
  "/getallusers",
  authMiddleware,
  getAllUsers
);

router.get(
  "/get-by/:id",
  authMiddleware,
  getUserById
);

router.put(
  "/update-user/:id",
  authMiddleware,
  updateUserByAdmin
);

router.delete(
  "/delete-user/:id",
  authMiddleware,
  deactivateUser
);

router.put(
  "/activate-user/:id",
  authMiddleware,
  activateUser
);

export default router;
