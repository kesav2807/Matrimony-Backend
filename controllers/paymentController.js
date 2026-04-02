const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

exports.createOrder = async (req, res) => {
    try {
        const razorpay = getRazorpayInstance();
        const { amount, currency = 'INR', planId } = req.body;
        
        // Defensive Check for Keys
        if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('YourKeyHere')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Razorpay keys not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file on the server.' 
            });
        }

        const options = {
            amount: Number(amount) * 100, // Amount in paise
            currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                planId,
                userId: req.user.id
            }
        };

        const order = await razorpay.orders.create(options);
        res.json({ 
            success: true, 
            order,
            keyId: process.env.RAZORPAY_KEY_ID 
        });
    } catch (error) {
        console.error('Razorpay Order creation failed:', error);
        res.status(500).json({ success: false, message: 'Razorpay error: ' + (error.message || 'Internal Server Error') });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const razorpay = getRazorpayInstance();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment is valid, upgrade the user
            const user = await User.findById(req.user.id);
            if (user) {
                user.status.isPremium = true;
                user.status.plan = planId;
                await user.save();
            }
            res.json({ success: true, message: 'Payment verified and profile upgraded' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Razorpay Verification Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
