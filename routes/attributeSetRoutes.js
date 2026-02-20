import express from "express";
import {
  createAttributeSet,
  getAllAttributeSets,
  getAttributeSetById,
  updateAttributeSet,
  deleteAttributeSet,
} from "../controllers/attributeSetController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,

  createAttributeSet,
);

router.get("/getAll", authMiddleware, getAllAttributeSets);

router.get("/getById/:id", authMiddleware, getAttributeSetById);

router.put("/update/:id", authMiddleware, updateAttributeSet);

router.delete("/delete/:id", authMiddleware, deleteAttributeSet);

export default router;
