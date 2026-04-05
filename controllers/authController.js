const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/emailService');

// In-memory OTP store: { email: { otp, expiresAt, verified } }
const otpStore = new Map();

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
    console.log('Registration attempt started:', req.body?.contactInfo?.email || 'unknown');
    try {
        const { basicInfo, contactInfo, password, personalDetails, partnerPreferences, profilePhotos } = req.body;

        if (!contactInfo || !contactInfo.email) {
            console.log('Registration failed: Missing contact info');
            return res.status(400).json({ success: false, message: 'Please provide email and other details' });
        }

        // Check if user exists
        console.log('Checking for existing user...');
        const userExists = await User.findOne({ 
            $or: [{ 'contactInfo.email': contactInfo.email }, { 'contactInfo.mobile': contactInfo.mobile }] 
        });

        if (userExists) {
            console.log('User already exists');
            return res.status(400).json({ success: false, message: 'User already exists with this email or mobile' });
        }

        // Create user
        console.log('Creating user in database...');
        const user = await User.create({
            basicInfo,
            contactInfo,
            password,
            personalDetails,
            partnerPreferences,
            profilePhotos
        });

        console.log('Generating auth token...');
        const token = generateToken(user._id);

        // Remove password before sending
        const userResponse = user.toObject();
        delete userResponse.password;

        console.log('Registration successful:', user.profileId);
        res.status(201).json({
            success: true,
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('REGISTRATION ERROR:', error.message);
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

        // Remove password before sending
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            token,
            user: userResponse
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

// ─── FORGOT PASSWORD – STEP 1: Send OTP ───
// @route POST /api/auth/send-otp
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

        const user = await User.findOne({ 'contactInfo.email': email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email address' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP
        otpStore.set(email, { otp, expiresAt, verified: false });

        // Send email
        console.log(`[OTP DEBUG] Sending OTP ${otp} to ${email}`);
        const mailResult = await sendOTPEmail(email, otp, user.basicInfo?.name || 'User');
        
        if (!mailResult.success) {
            console.log(`[TERMINAL OTP] FAILED TO SEND EMAIL. OTP IS: ${otp}`);
            return res.status(200).json({ success: true, message: `OTP generated. Use terminal value if email fails.`, debug: true });
        }
        
        res.status(200).json({ success: true, message: `OTP sent to ${email}` });
    } catch (error) {
        console.error('sendOTP error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Check email configuration.' });
    }
};

// ─── FORGOT PASSWORD – STEP 2: Verify OTP ───
// @route POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

        const record = otpStore.get(email);
        if (!record) {
            return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }
        if (record.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // Mark as verified
        otpStore.set(email, { ...record, verified: true });

        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── FORGOT PASSWORD – STEP 3: Reset Password ───
// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const record = otpStore.get(email);
        if (!record || !record.verified) {
            return res.status(403).json({ success: false, message: 'OTP not verified. Please complete verification first.' });
        }

        const user = await User.findOne({ 'contactInfo.email': email }).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        user.password = newPassword;
        await user.save();

        // Clean up OTP
        otpStore.delete(email);

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
