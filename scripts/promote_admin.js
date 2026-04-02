const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const promoteAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = process.argv[2];
        if (!email) {
            console.error('Please provide an email/mobile: node promote_admin.js <email>');
            process.exit(1);
        }

        const user = await User.findOne({ 
            $or: [{ 'contactInfo.email': email }, { 'contactInfo.mobile': email }] 
        });

        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        user.status.role = 'Admin';
        await user.save();

        console.log(`User ${user.basicInfo.name} has been promoted to Admin!`);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

promoteAdmin();
