const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/remarkController');
const { protect } = require('../middleware/auth');

router.get('/project/:projectId', protect, ctrl.getByProject);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
