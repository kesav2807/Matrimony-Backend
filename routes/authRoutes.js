const express = require('express');
const { register, login, getMe, checkUser, sendOTP, verifyOTP, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/check-user', checkUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);


module.exports = router;
