const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/iotController');
const { protect, authorize } = require('../middleware/auth');

router.get('/project/:projectId', protect, ctrl.getByProject);
router.get('/:id', protect, ctrl.getOne);
router.get('/:id/readings', protect, ctrl.getLatestReadings);
router.post('/', protect, authorize('super_admin', 'site_manager'), ctrl.create);
router.post('/:id/readings', ctrl.pushReading); // Device-to-server (token-based)
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, authorize('super_admin'), ctrl.remove);

module.exports = router;
