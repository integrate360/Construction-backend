import express from "express";
import {
  createAttributeSet,
  getAllAttributeSets,
  getAttributeSetById,
  updateAttributeSet,
  deleteAttributeSet,
} from "../controllers/attributeSetController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  createAttributeSet,
);

router.get(
  "/getAll",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  getAllAttributeSets,
);

router.get(
  "/getById/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  getAttributeSetById,
);

router.put(
  "/update/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  updateAttributeSet,
);

router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  deleteAttributeSet,
);

export default router;
