const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dummyUsers = [
            // 5 Males
            {
                basicInfo: { profileFor: 'Self', name: 'Arun Kumar', gender: 'Male', dob: new Date('1995-05-15'), religion: 'Hindu', fatherTongue: 'Tamil', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '9876543210', email: 'arun@demo.com', location: { city: 'Madurai', state: 'Tamil Nadu' } },
                personalDetails: { education: 'B.E Computer Science', occupation: 'Software Engineer', caste: 'Vellalar', aboutSelf: 'Ambitious and family-oriented person.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop'],
                status: { completeness: 85, isVerified: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Sathish Pillai', gender: 'Male', dob: new Date('1992-08-20'), religion: 'Hindu', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '9876543211', email: 'sathish@demo.com', location: { city: 'Chennai', state: 'Tamil Nadu' } },
                personalDetails: { education: 'MBA', occupation: 'Marketing Manager', caste: 'Pillai', aboutSelf: 'Outgoing and loves traveling.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop'],
                status: { completeness: 90, isVerified: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Ravi Teja', gender: 'Male', dob: new Date('1994-12-10'), religion: 'Hindu', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '9876543212', email: 'ravi@demo.com', location: { city: 'Coimbatore', state: 'Tamil Nadu' } },
                personalDetails: { education: 'M.Tech', occupation: 'Civil Engineer', caste: 'Mudaliar', aboutSelf: 'Simple person with traditional values.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop'],
                status: { completeness: 80, isPremium: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Mohammed Yusuf', gender: 'Male', dob: new Date('1990-03-25'), religion: 'Muslim', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '9876543213', email: 'yusuf@demo.com', location: { city: 'Tirunelveli', state: 'Tamil Nadu' } },
                personalDetails: { education: 'B.Com', occupation: 'Business Owner', caste: 'Lebbai', aboutSelf: 'Entrepetreural and hard working.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=500&fit=crop'],
                status: { completeness: 75, isVerified: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Deepak Raj', gender: 'Male', dob: new Date('1997-11-05'), religion: 'Christian', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '9876543214', email: 'deepak@demo.com', location: { city: 'Madurai', state: 'Tamil Nadu' } },
                personalDetails: { education: 'M.C.A', occupation: 'Data Scientist', caste: 'Nadars', aboutSelf: 'Tech enthusiast looking for a partner.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop'],
                status: { completeness: 95, isVerified: true }
            },
            // 5 Females
            {
                basicInfo: { profileFor: 'Self', name: 'Priya Mani', gender: 'Female', dob: new Date('1996-02-14'), religion: 'Hindu', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '8876543210', email: 'priya@demo.com', location: { city: 'Madurai', state: 'Tamil Nadu' } },
                personalDetails: { education: 'B.Sc Nursing', occupation: 'Registered Nurse', caste: 'Gounder', aboutSelf: 'Caring and empathetic nature.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop'],
                status: { completeness: 88, isVerified: true }
            },
            {
                basicInfo: { profileFor: 'Daughter', name: 'Anushya Devi', gender: 'Female', dob: new Date('1994-07-22'), religion: 'Hindu', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '8876543211', email: 'anushya@demo.com', location: { city: 'Trichy', state: 'Tamil Nadu' } },
                personalDetails: { education: 'M.A English', occupation: 'School Teacher', caste: 'Thevar', aboutSelf: 'Looking for a well-settled family.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'],
                status: { completeness: 92, isPremium: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Lakshmi Narayan', gender: 'Female', dob: new Date('1998-05-30'), religion: 'Hindu', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '8876543212', email: 'lakshmi@demo.com', location: { city: 'Madurai', state: 'Tamil Nadu' } },
                personalDetails: { education: 'B.Tech', occupation: 'Web Developer', caste: 'Vellalar', aboutSelf: 'Creative mind and passionate about coding.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'],
                status: { completeness: 80, isVerified: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Meenakshi Iyer', gender: 'Female', dob: new Date('1993-12-01'), religion: 'Hindu', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '8876543213', email: 'meena@demo.com', location: { city: 'Chennai', state: 'Tamil Nadu' } },
                personalDetails: { education: 'Ph.D in Arts', occupation: 'College Professor', caste: 'Brahmin', aboutSelf: 'Traditional yet modern thinker.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop'],
                status: { completeness: 100, isVerified: true, isPremium: true }
            },
            {
                basicInfo: { profileFor: 'Self', name: 'Jenifer Gomez', gender: 'Female', dob: new Date('1995-09-09'), religion: 'Christian', motherTongue: 'Tamil', maritalStatus: 'Never Married' },
                contactInfo: { mobile: '8876543214', email: 'jeni@demo.com', location: { city: 'Tuticorin', state: 'Tamil Nadu' } },
                personalDetails: { education: 'MBBS', occupation: 'Doctor', caste: 'Nadar', aboutSelf: 'Calm and steady person.' },
                password: 'password123',
                profilePhotos: ['https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400&h=500&fit=crop'],
                status: { completeness: 95, isVerified: true }
            }
        ];

        // Filter out existing ones by email or mobile to prevent duplication
        for (const userData of dummyUsers) {
            const exists = await User.findOne({ 
                $or: [
                    { 'contactInfo.email': userData.contactInfo.email },
                    { 'contactInfo.mobile': userData.contactInfo.mobile }
                ]
            });

            if (!exists) {
                const newUser = new User(userData);
                await newUser.save();
                console.log(`User ${userData.basicInfo.name} created!`);
            } else {
                console.log(`User ${userData.basicInfo.name} already exists.`);
            }
        }

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
