const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/materialController');
const { protect } = require('../middleware/auth');

router.get('/project/:projectId', protect, ctrl.getByProject);
router.get('/:id', protect, ctrl.getOne);
router.post('/', protect, ctrl.create);
router.post('/:id/transactions', protect, ctrl.addTransaction);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
