const mongoose = require('mongoose');

const ProfileViewSchema = new mongoose.Schema({
    viewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Optional: You could make this unique per day, but let's keep it simple (one unique per pair)
ProfileViewSchema.index({ viewer: 1, profile: 1 }, { unique: true });

module.exports = mongoose.model('ProfileView', ProfileViewSchema);
