const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/boqController');
const { protect, authorize } = require('../middleware/auth');

router.get('/project/:projectId', protect, ctrl.getByProject);
router.get('/:id', protect, ctrl.getOne);
router.get('/:id/rate-difference', protect, ctrl.getRateDifference);
router.post('/', protect, authorize('super_admin', 'accountant'), ctrl.create);
router.post('/:id/items', protect, ctrl.addItem);
router.put('/:id', protect, ctrl.update);
router.put('/:id/items/:itemId', protect, ctrl.updateItem);
router.delete('/:id/items/:itemId', protect, ctrl.deleteItem);
router.delete('/:id', protect, authorize('super_admin'), ctrl.remove);

module.exports = router;
