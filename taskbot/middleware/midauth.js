const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
exports.authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace 'secretkey' with an environment variable
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Invalid token' });
    }
};

// Middleware for role-based access control
exports.roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        next();
    };
};
