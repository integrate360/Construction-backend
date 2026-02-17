const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/labourController');
const { protect } = require('../middleware/auth');

router.get('/project/:projectId', protect, ctrl.getByProject);
router.get('/:id', protect, ctrl.getOne);
router.get('/:id/attendance-summary', protect, ctrl.getAttendanceSummary);
router.post('/', protect, ctrl.create);
router.post('/:id/attendance', protect, ctrl.markAttendance);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
