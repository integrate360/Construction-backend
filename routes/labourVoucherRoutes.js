import express from "express";
import {
  createLabourVoucher,
  getAllLabourVouchers,
  getLabourVoucherById,
  updateLabourVoucher,
  cancelLabourVoucher,
  getLabourVoucherStats,
  getVouchersByProject,
  getVouchersByUser,
  getMyVouchers,
} from "../controllers/labourVoucherController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes are protected - this applies protect to all routes below
router.use(authMiddleware);

// Statistics
router.get("/stats", getLabourVoucherStats);

// Create
router.post("/create-new", authMiddleware, createLabourVoucher);

// Read/Get all
router.get("/getAllLabourVouchers", getAllLabourVouchers);

// Read/Get single
router.get("/getLabourVoucherById/:id", getLabourVoucherById);

// Update
router.put("/updateLabourVoucher/:id", authMiddleware, updateLabourVoucher);

// Cancel
router.patch("/cancelLabourVoucher/:id", authMiddleware, cancelLabourVoucher);

// By project
router.get("/by-project/:projectId", getVouchersByProject);

// By user
router.get("/getVouchersByUser/:userId", getVouchersByUser);


router.get('/getMyVouchers', authMiddleware, getMyVouchers);

export default router;
