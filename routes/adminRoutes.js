const express = require('express');
const { adminLogin, getAllUsers, verifyUser, getStats, updateUserStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public login
router.post('/login', adminLogin);

// Protected admin-only routes
router.use(protect);
router.use(authorize('Admin'));

router.get('/users', getAllUsers);
router.get('/stats', getStats);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
