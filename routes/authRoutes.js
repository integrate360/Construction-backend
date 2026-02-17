import express from 'express';
import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  deactivateUser,
} from '../controllers/authController.js';

import authMiddleware from '../middleware/authmiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private (Logged-in user)
router.get('/me', authMiddleware, getMyProfile);
router.put('/me', authMiddleware, updateMyProfile);
router.put('/change-password', authMiddleware, changePassword);

// Admin only
router.get('/', authMiddleware, roleMiddleware('super_admin'), getAllUsers);
router.get('/:id', authMiddleware, roleMiddleware('super_admin'), getUserById);
router.put('/:id', authMiddleware, roleMiddleware('super_admin'), updateUserByAdmin);
router.delete('/:id', authMiddleware, roleMiddleware('super_admin'), deactivateUser);

export default router;
