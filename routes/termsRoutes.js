const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/termsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, ctrl.getActive);
router.get('/history', protect, ctrl.getHistory);
router.post('/', protect, authorize('super_admin'), ctrl.create);
router.put('/:id', protect, authorize('super_admin'), ctrl.update);

module.exports = router;
