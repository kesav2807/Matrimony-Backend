const User = require('../models/User');
const Interest = require('../models/Interest');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Admin Login
// @route   POST /api/admin/login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ 
            $or: [{ 'contactInfo.email': email }, { 'contactInfo.mobile': email }],
            'status.role': { $regex: /^admin$/i }
        }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: { _id: user._id, role: user.status.role, name: user.basicInfo.name }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Profile
// @route   PUT /api/admin/users/:id/verify
exports.verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.status.isVerified = !user.status.isVerified;
        await user.save();
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get system stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ 'status.role': { $regex: /^user$/i } });
        const premiumUsers = await User.countDocuments({ 'status.isPremium': true });
        const verifiedUsers = await User.countDocuments({ 'status.isVerified': true });
        const interestsSent = await Interest.countDocuments({});
        const messagesSent = await Message.countDocuments({});

        // Get gender distribution
        const maleCount = await User.countDocuments({ 'basicInfo.gender': 'Male' });
        const femaleCount = await User.countDocuments({ 'basicInfo.gender': 'Female' });

        res.json({
            success: true,
            data: {
                totalUsers,
                premiumUsers,
                verifiedUsers,
                interestsSent,
                messagesSent,
                genderDistribution: { male: maleCount, female: femaleCount }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Suspend Account
// @route   PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.status.role = role || 'Suspended';
        await user.save();

        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Registration Stats (last 6 months)
// @route   GET /api/admin/registration-stats
exports.getRegistrationStats = async (req, res) => {
    try {
        const stats = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
            
            const count = await User.countDocuments({
                'status.role': { $regex: /^user$/i },
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            
            stats.push({
                label: monthNames[month],
                value: count
            });
        }

        // Calculate percentage increase between this month and last month
        const currentMonthCount = stats[5].value;
        const lastMonthCount = stats[4].value;
        let percentageIncrease = 0;
        
        if (lastMonthCount > 0) {
            percentageIncrease = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
        } else if (currentMonthCount > 0) {
            percentageIncrease = 100; // From 0 to something is 100% growth
        }

        res.status(200).json({
            success: true,
            data: stats,
            percentageIncrease: percentageIncrease > 0 ? `+${percentageIncrease}%` : `${percentageIncrease}%`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
