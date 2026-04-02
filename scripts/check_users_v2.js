const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'basicInfo.name contactInfo.email contactInfo.mobile').limit(10);
        if (users.length === 0) {
            console.log('No users registered in the database yet.');
        } else {
            console.log('Registered Users (First 10):');
            users.forEach(u => {
                console.log(`- Name: ${u.basicInfo.name}, Email: ${u.contactInfo.email}, Mobile: ${u.contactInfo.mobile}, ID: ${u._id}`);
            });
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkUsers();
