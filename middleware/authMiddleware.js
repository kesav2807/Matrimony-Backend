const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        // Set token from cookie
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.status || !req.user.status.role) {
            return res.status(403).json({ success: false, message: 'Forbidden: No valid role found' });
        }
        
        const userRole = req.user.status.role.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            console.warn(`[AUTH] Forbidden: User ${req.user?._id} with role "${req.user?.status?.role}" attempted access. Allowed: ${JSON.stringify(roles)}`);
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.status.role} is not authorized to access this route`,
            });
        }
        next();
    };
};
