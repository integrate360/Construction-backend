import express from "express";
import {
  createAttribute,
  getAllAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
} from "../controllers/attributeController.js";
import authMiddleware from "../middleware/authmiddleware.js";


const router = express.Router();

router.post(
  "/createAttribute",
  authMiddleware,

  createAttribute,
);

router.get(
  "/getAllAttributes",
  authMiddleware,
  getAllAttributes,
);

router.get(
  "/getAttributeById/:id",
  authMiddleware,
  getAttributeById,
);

router.put(
  "/updateAttribute/:id",
  authMiddleware,
  updateAttribute,
);

router.delete(
  "/deleteAttribute/:id",
  authMiddleware,
  deleteAttribute,
);

export default router;
