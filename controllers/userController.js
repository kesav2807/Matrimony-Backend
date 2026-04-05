const mongoose = require('mongoose');
const User = require('../models/User');
const Interest = require('../models/Interest');
const Message = require('../models/Message');
const ProfileView = require('../models/ProfileView');
const Shortlist = require('../models/Shortlist');
const Notification = require('../models/Notification');
const Ignore = require('../models/Ignore');

// ... (other methods)

// @desc    Send a message
// @route   POST /api/users/message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        
        // Check if interest is accepted first
        const acceptedInterest = await Interest.findOne({
            $or: [
                { sender: req.user.id, receiver: receiverId, status: 'accepted' },
                { sender: receiverId, receiver: req.user.id, status: 'accepted' }
            ]
        });

        if (!acceptedInterest) {
            return res.status(403).json({ success: false, message: 'You can only message users who have accepted your interest' });
        }

        const message = await Message.create({
            sender: req.user.id,
            receiver: receiverId,
            content: text
        });

        // Create Notification
        await Notification.create({
            receiver: receiverId,
            sender: req.user.id,
            type: 'message'
        });

        const io = req.app.get('socketio');
        if (io) {
            // Emit the message
            io.to(receiverId).emit('message received', {
                ...message.toObject(),
                senderName: req.user.name || 'Member'
            });
            // Emit a notification
            io.to(receiverId).emit('notification', {
                message: `New message from ${req.user.name || 'a member'}`,
                type: 'message'
            });
        }

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get messages with a specific user
// @route   GET /api/users/messages/:id
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.id },
                { sender: req.params.id, receiver: req.user.id }
            ]
        }).sort({ createdAt: 1 });

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ... (Rest of previously defined methods for dashboard, matches, interest status, etc.)
// Re-adding the core exports to keep file complete
exports.respondToInterest = async (req, res) => {
    try {
        const { status } = req.body;
        const interest = await Interest.findById(req.params.id);
        if (!interest) return res.status(404).json({ success: false });
        interest.status = status;
        await interest.save();

        if (status === 'accepted') {
            await Notification.create({
                receiver: interest.sender,
                sender: req.user.id,
                type: 'accept'
            });

            const io = req.app.get('socketio');
            if (io) {
                io.to(interest.sender.toString()).emit('notification', {
                    message: `${req.user.name || 'A member'} accepted your interest!`,
                    type: 'accept'
                });
            }
        }

        res.json({ success: true, data: interest });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getDashboardData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const stats = {
            interestsReceived: await Interest.countDocuments({ receiver: req.user.id }),
            messagesReceived: await Message.countDocuments({ receiver: req.user.id, isRead: false }),
            profileViews: await ProfileView.countDocuments({ profile: req.user.id }),
            shortlistedBy: await Shortlist.countDocuments({ receiver: req.user.id })
        };
        const oppositeGender = user.basicInfo.gender === 'Male' ? 'Female' : 'Male';
        
        const ignored = await Ignore.find({ sender: req.user.id });
        const ignoredIds = ignored.map(i => i.receiver);
        
        const baseQuery = { 
            _id: { $ne: req.user.id, $nin: ignoredIds }, 
            'basicInfo.gender': oppositeGender,
            'status.role': { $nin: ['Admin', 'admin'] } 
        };
        const recommendations = {
            dailyMatches: await User.find(baseQuery).limit(8).sort({ createdAt: -1 }),
            newMembers: await User.find(baseQuery).limit(8).sort({ createdAt: -1 }),
            nearMe: await User.find({ ...baseQuery, 'contactInfo.location.city': user.contactInfo.location.city }).limit(8)
        };
        res.json({ success: true, user, stats, recommendations });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMatches = async (req, res) => {
    try {
        const { ageMin, ageMax, religion, caste, city, education, tab, subFilter } = req.query;
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });
        
        const oppositeGender = currentUser.basicInfo.gender === 'Male' ? 'Female' : 'Male';

        const ignored = await Ignore.find({ sender: req.user.id });
        const ignoredIds = ignored.map(i => i.receiver);

        let query = { 
            _id: { $ne: req.user.id, $nin: ignoredIds }, 
            'basicInfo.gender': oppositeGender,
            'status.role': { $nin: ['Admin', 'admin'] }
        };

        if (ageMin || ageMax) {
            query['basicInfo.age'] = { 
                $gte: parseInt(ageMin) || 18, 
                $lte: parseInt(ageMax) || 100 
            };
        }
        if (religion) query['basicInfo.religion'] = religion;
        if (caste) query['personalDetails.caste'] = { $regex: caste, $options: 'i' };
        if (city) query['contactInfo.location.city'] = { $regex: city, $options: 'i' };
        if (education) query['personalDetails.education'] = { $regex: education, $options: 'i' };

        // Handle Tabs
        if (tab === 'new') {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            query.createdAt = { $gte: lastWeek };
        } else if (tab === 'shortlist') {
            const shortlists = await Shortlist.find({ sender: req.user.id });
            const peerIds = shortlists.map(s => s.receiver);
            query._id = { $in: peerIds };
        }

        // Handle Sub-Filters
        if (subFilter === 'with_photo') {
            query.profilePhotos = { $exists: true, $not: { $size: 0 } };
        } else if (subFilter === 'premium') {
            query['status.isPremium'] = true;
        }

        const matchesRaw = await User.find(query).limit(50).sort({ createdAt: -1 });
        const myInterests = await Interest.find({ sender: req.user.id });
        const myShortlists = await Shortlist.find({ sender: req.user.id });

        const matches = matchesRaw.map(user => {
            const u = user.toObject();
            u.hasSentInterest = myInterests.some(i => i.receiver.toString() === u._id.toString());
            u.isShortlisted = myShortlists.some(s => s.receiver.toString() === u._id.toString());
            return u;
        });

        res.json({ success: true, data: matches });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getReceivedInterests = async (req, res) => {
    try {
        const interests = await Interest.find({ receiver: req.user.id }).populate('sender').sort({ createdAt: -1 });
        res.json({ success: true, data: interests });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getSentInterests = async (req, res) => {
    try {
        const interests = await Interest.find({ sender: req.user.id }).populate('receiver').sort({ createdAt: -1 });
        res.json({ success: true, data: interests });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.sendInterest = async (req, res) => {
    try {
        const interest = await Interest.create({ sender: req.user.id, receiver: req.body.receiverId });
        
        const notif = await Notification.create({
            receiver: req.body.receiverId,
            sender: req.user.id,
            type: 'interest'
        });

        const io = req.app.get('socketio');
        if (io) {
            io.to(req.body.receiverId).emit('notification', {
                message: `You received a new interest from ${req.user.name || 'a member'}`,
                type: 'interest',
                sender: req.user.id
            });
        }

        res.status(201).json({ success: true, data: interest });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.cancelInterest = async (req, res) => {
    try {
        await Interest.findOneAndDelete({ sender: req.user.id, receiver: req.body.receiverId });
        await Notification.findOneAndDelete({ sender: req.user.id, receiver: req.body.receiverId, type: 'interest' });
        res.json({ success: true, message: 'Interest cancelled' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.shortlistUser = async (req, res) => {
    try {
        const existing = await Shortlist.findOne({ sender: req.user.id, receiver: req.body.receiverId });
        if (existing) { await Shortlist.findByIdAndDelete(existing._id); return res.json({ success: true, action: 'removed' }); }
        await Shortlist.create({ sender: req.user.id, receiver: req.body.receiverId });
        res.json({ success: true, action: 'added' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.ignoreUser = async (req, res) => {
    try {
        await Ignore.create({ sender: req.user.id, receiver: req.body.receiverId });
        res.json({ success: true, message: 'User ignored' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.getViewers = async (req, res) => {
    try {
        const views = await ProfileView.find({ profile: req.user.id }).populate('viewer').sort({ createdAt: -1 });
        res.json({ success: true, data: views.map(v => v.viewer).filter(u => u != null) });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getShortlistedBy = async (req, res) => {
    try {
        const sh = await Shortlist.find({ receiver: req.user.id }).populate('sender').sort({ createdAt: -1 });
        res.json({ success: true, data: sh.map(s => s.sender).filter(u => u != null) });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { basicInfo, personalDetails, contactInfo, partnerPreferences } = req.body;

        if (basicInfo) {
            // Extract email if present and map to contactInfo.email
            const { email, ...restBasic } = basicInfo;
            if (email) user.contactInfo.email = email;
            user.basicInfo = { ...user.basicInfo, ...restBasic };
        }
        if (personalDetails) user.personalDetails = { ...user.personalDetails, ...personalDetails };
        if (contactInfo) {
            if (contactInfo.location) {
                user.contactInfo.location = { ...user.contactInfo.location, ...contactInfo.location };
            }
        }
        
        if (partnerPreferences) {
            const { ageMin, ageMax, religion, caste, city, education, ...rest } = partnerPreferences;
            
            user.partnerPreferences = { 
                ...user.partnerPreferences?.toObject(), 
                ...rest,
                ageRange: {
                    min: ageMin !== undefined ? parseInt(ageMin) : user.partnerPreferences?.ageRange?.min,
                    max: ageMax !== undefined ? parseInt(ageMax) : user.partnerPreferences?.ageRange?.max
                },
                // Handle strings to array mapping for matches logic compatibility
                religion: religion ? [religion] : user.partnerPreferences?.religion,
                caste: caste ? [caste] : user.partnerPreferences?.caste,
                location: city ? [city] : user.partnerPreferences?.location,
                education: education ? [education] : user.partnerPreferences?.education
            };
        }
        
        await user.save();
        res.json({ success: true, data: user });
    } catch (error) { 
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: error.message }); 
    }
};

exports.upgradeUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.status.isPremium = true;
        await user.save();
        res.json({ success: true, data: user });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid profile ID' });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        if (req.user && req.user.id !== req.params.id) { 
            try { 
                await ProfileView.create({ viewer: req.user.id, profile: req.params.id }); 
                await Notification.create({
                    receiver: req.params.id,
                    sender: req.user.id,
                    type: 'view'
                });
            } 
            catch (err) { } 
        }
        res.json({ success: true, data: user });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getChatList = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        }).sort({ createdAt: -1 });

        const peerIds = [...new Set(messages.map(m => 
            m.sender.toString() === req.user.id.toString() ? m.receiver.toString() : m.sender.toString()
        ))];

        const chatPeers = await User.find({ _id: { $in: peerIds } });
        
        const chatList = await Promise.all(chatPeers.map(async (peer) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: req.user.id, receiver: peer._id },
                    { sender: peer._id, receiver: req.user.id }
                ]
            }).sort({ createdAt: -1 });
            return { peer, lastMsg };
        }));

        res.json({ success: true, data: chatList.sort((a,b) => {
            const dateA = a.lastMsg ? new Date(a.lastMsg.createdAt) : 0;
            const dateB = b.lastMsg ? new Date(b.lastMsg.createdAt) : 0;
            return dateB - dateA;
        })});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ receiver: req.user.id })
            .populate('sender')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { receiver: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const photoUrl = req.file.path;
        
        // Push to portfolio if it's not already there
        if (!user.profilePhotos) user.profilePhotos = [];
        if (!user.profilePhotos.includes(photoUrl)) {
            user.profilePhotos.push(photoUrl);
        }

        // If it's the first photo or primary is empty, set as primary
        if (!user.profileImage || user.profileImage === '') {
            user.profileImage = photoUrl;
        }

        await user.save();
        res.json({ success: true, data: user, url: photoUrl });
    } catch (error) {
        console.error('Photo Upload Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProfilePhoto = async (req, res) => {
    try {
        const { photoUrl } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.profilePhotos = user.profilePhotos.filter(p => p !== photoUrl);
        
        // If we deleted the primary image, pick a new one or clear it
        if (user.profileImage === photoUrl) {
            user.profileImage = user.profilePhotos[0] || '';
        }

        await user.save();
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProfileMetrics = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false });

        const viewsCount = await ProfileView.countDocuments({ profile: req.user.id });
        const precisionRating = user.calculateCompleteness();
        
        // Dynamic Match Score logic: base completeness + photo bonus
        const photoBonus = (user.profilePhotos?.length || 0) * 5;
        const matchScoreImpact = Math.min(100, Math.round(precisionRating * 0.8 + photoBonus));

        res.json({
            success: true,
            stats: {
                totalViews: viewsCount || 0,
                matchScore: matchScoreImpact,
                auditPrecision: precisionRating
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
