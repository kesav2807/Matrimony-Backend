const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { basicInfo, contactInfo, password, personalDetails, partnerPreferences, profilePhotos } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ 
            $or: [{ 'contactInfo.email': contactInfo.email }, { 'contactInfo.mobile': contactInfo.mobile }] 
        });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email or mobile' });
        }

        // Create user
        const user = await User.create({
            basicInfo,
            contactInfo,
            password,
            personalDetails,
            partnerPreferences,
            profilePhotos
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                profileId: user.profileId,
                name: user.basicInfo.name,
                email: user.contactInfo.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check for user by email or mobile
        const user = await User.findOne({
            $or: [
                { 'contactInfo.email': email },
                { 'contactInfo.mobile': email }
            ]
        }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                profileId: user.profileId,
                name: user.basicInfo.name,
                email: user.contactInfo.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Check if user exists
// @route   POST /api/auth/check-user
// @access  Public
exports.checkUser = async (req, res) => {
    try {
        const { email, mobile } = req.body;

        const userExists = await User.findOne({ 
            $or: [{ 'contactInfo.email': email }, { 'contactInfo.mobile': mobile }] 
        });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email or mobile' });
        }

        res.status(200).json({ success: true, message: 'User is unique' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user

// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
