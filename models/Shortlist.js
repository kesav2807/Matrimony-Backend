const mongoose = require('mongoose');

const ShortlistSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Prevent duplicate shortlisting
ShortlistSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model('Shortlist', ShortlistSchema);
