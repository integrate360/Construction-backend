const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/project-profit',   protect, ctrl.projectProfitReport);
router.get('/labour-cost',      protect, ctrl.labourCostReport);
router.get('/material',         protect, ctrl.materialReport);
router.get('/boq-vs-actual',    protect, ctrl.boqVsActualReport);
router.get('/phase-progress',   protect, ctrl.phaseProgressReport);
router.get('/iot-status',       protect, ctrl.iotStatusReport);

module.exports = router;
