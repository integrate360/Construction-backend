const express = require('express');
const router  = express.Router();
const { getDashboard, getAll, getOne, create, update, updatePhase, remove } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, getDashboard);
router.get('/', protect, getAll);
router.get('/:id', protect, getOne);
router.post('/', protect, authorize('super_admin', 'site_manager'), create);
router.put('/:id', protect, authorize('super_admin', 'site_manager'), update);
router.put('/:id/phases/:phaseNumber', protect, updatePhase);
router.delete('/:id', protect, authorize('super_admin'), remove);

module.exports = router;
