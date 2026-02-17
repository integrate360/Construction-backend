const express = require('express');
const router  = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAll);
router.get('/:id', protect, getOne);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;
