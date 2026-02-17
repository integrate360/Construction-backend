const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('super_admin', 'accountant'), ctrl.getDashboard);
router.get('/execution/:projectId', protect, ctrl.getExecutionMonitoring);

module.exports = router;
