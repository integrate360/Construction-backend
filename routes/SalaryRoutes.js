import express from "express";
import {
  createSalaryStructure,
  getAllSalaryStructures,
  getSalaryStructureById,
  updateSalaryStructure,
  deleteSalaryStructure,
  getActiveSalaryStructure,
  generatePayroll,
  generateBulkPayroll,
  getAllPayrolls,
  getPayrollById,
  updatePayroll,
  markPayrollAsPaid,
  getProjectPayrollSummary,
  deletePayroll,
  giveAdvance,
  getAllAdvances,
  getAdvanceById,
  getUserAdvances,
  recoverAdvance,
  updateAdvance,
  deleteAdvance,
  getProjectAdvanceSummary,
  downloadSalarySlip,
  getProjectUsers,
  getMyPayrolls,
  previewSalary,
  getMyAdvances,
} from "../controllers/salaryController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/structure", getAllSalaryStructures);
router.get("/my/salary", previewSalary);

router.post("/structure", createSalaryStructure);

router.get("/structure/active/:userId/:projectId", getActiveSalaryStructure);

router.get("/structure/:id", getSalaryStructureById);

router.put("/structure/:id", updateSalaryStructure);

router.delete("/structure/:id", deleteSalaryStructure);

router.get("/payroll", getAllPayrolls);

router.get("/my-payrolls", getMyPayrolls);
router.get("/getMyAdvances", getMyAdvances);
router.post("/payroll/generate", generatePayroll);

router.post("/payroll/generate-bulk", generateBulkPayroll);

router.get("/payroll/summary/:projectId", getProjectPayrollSummary);

router.get("/payroll/:id", getPayrollById);

router.put("/payroll/:id", updatePayroll);

router.delete("/payroll/:id", deletePayroll);

router.patch("/payroll/:id/pay", markPayrollAsPaid);

router.get("/advance", getAllAdvances);

router.post("/advance", giveAdvance);

router.get("/advance/summary/:projectId", getProjectAdvanceSummary);

router.get("/payroll/:id/slip", downloadSalarySlip);

router.get("/advance/user/:userId/:projectId", getUserAdvances);

router.get("/advance/:id", getAdvanceById);

router.put("/advance/:id", updateAdvance);

router.delete("/advance/:id", deleteAdvance);

router.patch("/advance/:id/recover", recoverAdvance);

router.get("/projects/:projectId/users", getProjectUsers);

export default router;
