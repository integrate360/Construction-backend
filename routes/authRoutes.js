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

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/get/me', authMiddleware, getMyProfile);
router.put('/update/me', authMiddleware, updateMyProfile);
router.put('/change-password', authMiddleware, changePassword);
router.get('/getallusers', authMiddleware, roleMiddleware('super_admin'), getAllUsers);
router.get('/get-by/:id', authMiddleware, roleMiddleware('super_admin'), getUserById);
router.put('/update-user/:id', authMiddleware, roleMiddleware('super_admin'), updateUserByAdmin);
router.delete('/delete-user/:id', authMiddleware, roleMiddleware('super_admin'), deactivateUser);

export default router;
