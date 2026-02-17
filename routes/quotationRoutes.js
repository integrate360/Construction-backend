const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, ctrl.getAll);
router.get('/:id', protect, ctrl.getOne);
router.post('/', protect, authorize('super_admin', 'accountant'), ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, authorize('super_admin'), ctrl.remove);

module.exports = router;
