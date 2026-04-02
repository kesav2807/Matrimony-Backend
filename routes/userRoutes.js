const express = require('express');
const { getMatches, updateProfile, getUser, upgradeUser, getDashboardData, getReceivedInterests, getSentInterests, sendInterest, cancelInterest, shortlistUser, ignoreUser, getViewers, getShortlistedBy, respondToInterest, sendMessage, getMessages, getChatList, getNotifications, markNotificationsRead } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

const router = express.Router();

router.get('/dashboard', protect, getDashboardData);
router.get('/matches', protect, getMatches);
router.get('/interests/received', protect, getReceivedInterests);
router.get('/interests/sent', protect, getSentInterests);
router.get('/views', protect, getViewers);
router.get('/shortlists', protect, getShortlistedBy);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.post('/interest', protect, sendInterest);
router.delete('/interest', protect, cancelInterest);
router.put('/interest/:id', protect, respondToInterest);
router.post('/message', protect, sendMessage);
router.get('/chatlist', protect, getChatList);
router.get('/messages/:id', protect, getMessages);
router.post('/shortlist', protect, shortlistUser);
router.post('/ignore', protect, ignoreUser);
router.post('/upgrade', protect, upgradeUser);
router.put('/profile', protect, updateProfile);
router.get('/:id', protect, getUser);

// Single photo upload
router.post('/upload-profile-photo', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({ success: true, url: req.file.path });
});

module.exports = router;
