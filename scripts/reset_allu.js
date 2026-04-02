const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ 'contactInfo.email': 'allu@gmail.com' });
        if (user) {
            user.password = 'allu';
            await user.save();
            console.log('Password for allu@gmail.com has been reset to "allu"');
        } else {
            console.log('User not found');
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

resetPassword();
