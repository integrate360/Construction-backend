import express from "express";
import {
  createAttribute,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
} from "../controllers/attributeController.js";
import authMiddleware from "../middleware/authmiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/createAttribute",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  createAttribute,
);

router.get(
  "/getAllAttributes",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  getAllAttributes,
);

router.get(
  "/getAttributeById/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  getAttributeById,
);

router.put(
  "/updateAttribute/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  updateAttribute,
);

router.delete(
  "/deleteAttribute/:id",
  authMiddleware,
  roleMiddleware(["super_admin"]),
  deleteAttribute,
);

export default router;
