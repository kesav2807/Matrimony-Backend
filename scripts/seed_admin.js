const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@gmail.com';
        const adminMobile = '9999999999'; // Placeholder mobile for admin
        const adminPassword = 'admin123';

        // Check if user exists
        let user = await User.findOne({ 
            $or: [{ 'contactInfo.email': adminEmail }, { 'contactInfo.mobile': adminEmail }, { 'contactInfo.mobile': adminMobile }] 
        });

        if (user) {
            console.log('Admin user already exists. Updating credentials...');
            user.password = adminPassword;
            user.status.role = 'Admin';
            await user.save();
        } else {
            console.log('Creating new Admin user...');
            user = await User.create({
                basicInfo: {
                    profileFor: 'Self',
                    name: 'System Admin',
                    gender: 'Male',
                    dob: new Date('1990-01-01'),
                    religion: 'Other',
                    motherTongue: 'English',
                    maritalStatus: 'Never Married',
                },
                contactInfo: {
                    email: adminEmail,
                    mobile: adminMobile,
                    location: {
                        country: 'India',
                        city: 'Madurai'
                    }
                },
                password: adminPassword,
                status: {
                    role: 'Admin',
                    isVerified: true
                }
            });
        }

        console.log(`Admin user seeded successfully!`);
        console.log(`Login: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

seedAdmin();
