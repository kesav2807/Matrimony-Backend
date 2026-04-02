const express = require('express');
const { register, login, getMe, checkUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/check-user', checkUser);
router.get('/me', protect, getMe);


module.exports = router;
