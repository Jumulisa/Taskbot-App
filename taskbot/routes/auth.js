// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { body, validationResult } = require('express-validator');
// const User = require('../models/User');

// const router = express.Router();

// // Register a new user
// router.post('/register', [
//     body('name').notEmpty(),
//     body('email').isEmail(),
//     body('password').isLength({ min: 6 }),
//     body('role').isIn(['staff', 'manager', 'hod'])
// ], async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { name, email, password, role } = req.body;
//     try {
//         let user = await User.findOne({ email });
//         if (user) return res.status(400).json({ msg: 'User already exists' });

//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         user = new User({ name, email, password: hashedPassword, role });
//         await user.save();

//         res.json({ msg: 'User registered successfully' });
//     } catch (error) {
//         res.status(500).json({ msg: 'Server error' });
//     }
// });

// module.exports = router;
// // User Login
// router.post('/login', [
//     body('email').isEmail(),
//     body('password').exists()
// ], async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//     const { email, password } = req.body;
//     try {
//         let user = await User.findOne({ email });
//         if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

//         // Generate JWT token
//         const token = jwt.sign({ userId: user.id, role: user.role }, 'secretkey', { expiresIn: '1h' });

//         res.json({ token });
//     } catch (error) {
//         res.status(500).json({ msg: 'Server error' });
//     }
// });
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware, roleMiddleware } = require('../middleware/midauth'); // Import middleware
require('dotenv').config(); // Load environment variables

const router = express.Router();

// Register a new user
router.post('/register', [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['staff', 'manager', 'hod'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        res.json({ msg: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// User Login
router.post('/login', [
    body('email').isEmail(),
    body('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Generate JWT token using environment variable
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Example of a protected route
router.get('/protected', authMiddleware, (req, res) => {
    res.json({ msg: 'This is a protected route', user: req.user });
});

// Example admin-only route
router.get('/admin', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    res.json({ msg: 'Admin access granted' });
});

module.exports = router;
