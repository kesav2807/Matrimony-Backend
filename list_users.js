const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const showUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).limit(10);
        console.log('--- USER DATABASE (FIRST 10) ---');
        users.forEach(u => {
            console.log(`[${u.status.role}] ${u.basicInfo.name} - ${u.contactInfo.email} (ID: ${u._id})`);
        });
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
};

showUsers();
