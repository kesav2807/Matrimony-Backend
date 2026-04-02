const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    profileId: { type: String, unique: true },
    
    // Step 1: Basic Details
    basicInfo: {
        profileFor: { type: String, enum: ['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Friend', 'Relative'], required: true },
        name: { type: String, required: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        dob: { type: Date, required: true },
        age: { type: Number },
        religion: { type: String, required: true },
        motherTongue: { type: String, required: true, default: 'Tamil' },
        maritalStatus: { type: String, enum: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'], required: true },
    },

    // Step 2: Contact & Account
    contactInfo: {
        mobile: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        location: {
            country: { type: String, default: 'India' },
            state: { type: String },
            city: { type: String },
        }
    },
    password: { type: String, required: true, select: false },

    // Step 3: Personal & Professional
    personalDetails: {
        height: { type: String },
        weight: { type: String },
        education: { type: String },
        college: { type: String },
        occupation: { type: String },
        income: { type: String },
        workLocation: { type: String },
        caste: { type: String },
        subCaste: { type: String },
        starRasi: { type: String },
        aboutSelf: { type: String },
    },

    // Step 4: Partner Preferences
    partnerPreferences: {
        ageRange: { min: Number, max: Number },
        heightRange: { min: String, max: String },
        religion: [{ type: String }],
        caste: [{ type: String }],
        location: [{ type: String }],
        education: [{ type: String }],
    },

    // Step 5: Profile Image
    profilePhotos: [{ type: String }],

    status: {
        completeness: { type: Number, default: 0 },
        isPremium: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        role: { type: String, default: 'User' },
    },
    privacy: {
        profileVisibility: { type: String, enum: ['All', 'Premium', 'Matches'], default: 'All' },
        photoVisibility: { type: String, enum: ['All', 'Premium', 'Members'], default: 'All' },
        showMobile: { type: Boolean, default: true },
    },
    notifications: {
        email: { type: Boolean, default: true },
        webPush: { type: Boolean, default: true },
    }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        this.profileId = `MM${String(count + 1).padStart(5, '0')}`;
    }

    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    if (this.basicInfo.dob) {
        const today = new Date();
        const birthDate = new Date(this.basicInfo.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        this.basicInfo.age = age;
    }
    
    next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
