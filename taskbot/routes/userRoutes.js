// const { SessionsClient } = require('@google-cloud/dialogflow'); // Corrected import
// const path = require('path');
// const uuid = require('uuid');
// const express = require('express');
// const router = express.Router();
// const User = require('../models/User'); // Only one declaration
// const jwt = require('jsonwebtoken'); // Required for token verification
// const verifyToken = require('../middleware/midauth'); 

// // Authorization middleware to check the token
// const checkAuth = (req, res, next) => {
//     const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from the header

//     if (!token) {
//         return res.status(403).json({ msg: 'No token, authorization denied' });
//     }

//     try {
//         // Verify the token with JWT (replace 'your_secret_key' with your actual secret key)
//         const decoded = jwt.verify(token, '1bf66fead66c3c099dcc47acc4dacea6935cc6d598e5e84bf8fa329856fbebec65590bfac7ef674ecd4146ffca0e5a9999a4d2fe91902a992bcdc6b711242f49');
//         req.user = decoded.user; // Attach the user to the request
//         next(); // Proceed to the next middleware or route handler
//     } catch (err) {
//         return res.status(403).json({ msg: 'Token is not valid' });
//     }
// };

// // Initialize Dialogflow session
// const sessionClient = new SessionsClient({
//     keyFilename: path.resolve(__dirname, 'mytaskbot-wnuy-737f0ac4916f.json') // Absolute path
// });
// const projectId = 'mytaskbot-wnuy'; // Replace with your Dialogflow project ID

// // Create a new user (registration)
// router.post('/register', async (req, res) => {
//     console.log('Received request to register a user:', req.body); // Log the incoming request body
//     const { name, email, role, section } = req.body;
//     if (!name || !email || !role || !section) {
//         return res.status(400).json({ message: 'All fields are required: name, email, role, section' });
//     }
//     try {
//         const newUser = new User({ name, email, role, section });
//         await newUser.save();
//         res.status(201).json(newUser);
//     } catch (err) {
//         console.error('Error saving user:', err); // Log any errors that happen
//         res.status(500).json({ message: err.message });
//     }
// });

// // Get all users
// router.get('/', async (req, res) => {
//     try {
//         const users = await User.find();
//         res.json(users);
//     } catch (err) {
//         res.status(500).json({ message: '❌ Server Error', error: err });
//     }
// });

// // Get a user by ID
// router.get('/:userId', async (req, res) => {
//     const { userId } = req.params;
//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.json(user);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// // Update a user by ID
// router.put('/update/:userId', async (req, res) => {
//     const { userId } = req.params;
//     const { name, email, role, section } = req.body;
//     try {
//         const updatedUser = await User.findByIdAndUpdate(userId, {
//             name,
//             email,
//             role,
//             section
//         }, { new: true });
//         if (!updatedUser) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.json(updatedUser);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// // Delete a user by ID
// router.delete('/delete/:userId', async (req, res) => {
//     const { userId } = req.params;
//     try {
//         const deletedUser = await User.findByIdAndDelete(userId);
//         if (!deletedUser) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         res.json({ message: 'User deleted successfully' });
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// });

// // Create a route to handle webhook requests from Dialogflow with authorization
// router.post('/webhook', checkAuth, async (req, res) => {
//     console.log(req.headers); // Add this line to debug
//     const queryText = req.body.queryText;
//     if (!queryText) {
//         return res.status(400).json({ message: 'No queryText provided in the request body' });
//     }

//     const sessionId = uuid.v4();
//     const sessionPath = sessionClient.sessionPath(projectId, sessionId);

//     const request = {
//         session: sessionPath,
//         queryInput: {
//             text: {
//                 text: queryText,
//                 languageCode: 'en-US',
//             },
//         },
//     };

//     try {
//         const responses = await sessionClient.detectIntent(request);
//         const result = responses[0].queryResult;
//         res.json({ fulfillmentText: result.fulfillmentText });
//     } catch (err) {
//         console.error('Error during Dialogflow request', err);
//         res.status(500).send('Error');
//     }
// });

// module.exports = router;

const { SessionsClient } = require('@google-cloud/dialogflow'); // Corrected import
const path = require('path');
const uuid = require('uuid');
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Only one declaration
const jwt = require('jsonwebtoken'); // Required for token verification
const verifyToken = require('../middleware/midauth'); 

// Authorization middleware to check the token
const checkAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from the header

    if (!token) {
        return res.status(403).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, '1bf66fead66c3c099dcc47acc4dacea6935cc6d598e5e84bf8fa329856fbebec65590bfac7ef674ecd4146ffca0e5a9999a4d2fe91902a992bcdc6b711242f49');
        req.user = decoded.user; 
        next();
    } catch (err) {
        console.error('JWT Error:', err); // Logs full error
        return res.status(403).json({ msg: 'Token is not valid', error: err.message });
    }
};

// Initialize Dialogflow session
const sessionClient = new SessionsClient({
    keyFilename: path.resolve(__dirname, 'mytaskbot-wnuy-737f0ac4916f.json') // Absolute path
});
const projectId = 'mytaskbot-wnuy'; 

// Create a new user (registration)
router.post('/register', async (req, res) => {
    console.log('Received request to register a user:', req.body); 
    const { name, email, role, section } = req.body;
    if (!name || !email || !role || !section) {
        console.error('Missing required fields:', { name, email, role, section });
        return res.status(400).json({ message: 'All fields are required: name, email, role, section' });
    }
    try {
        const newUser = new User({ name, email, role, section });
        await newUser.save();
        console.log('User saved successfully:', newUser);
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error saving user:', err.stack); // Logs full error
        res.status(500).json({ message: err.message });
    }
});

// Webhook for Dialogflow
router.post('/webhook', checkAuth, async (req, res) => {
    console.log('Webhook Request Headers:', req.headers);
    console.log('Webhook Request Body:', req.body);
    const queryText = req.body.queryText;
    if (!queryText) {
        return res.status(400).json({ message: 'No queryText provided in the request body' });
    }
    const sessionId = uuid.v4();
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: queryText,
                languageCode: 'en-US',
            },
        },
    };
    try {
        const responses = await sessionClient.detectIntent(request);
        res.json({ fulfillmentText: responses[0].queryResult.fulfillmentText });
    } catch (err) {
        console.error('Dialogflow Error:', err.stack); // Logs full error
        res.status(500).json({ message: 'Error processing request', error: err.message });
    }
});

// Global Error Handler (Catches All Errors)
router.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

module.exports = router;
