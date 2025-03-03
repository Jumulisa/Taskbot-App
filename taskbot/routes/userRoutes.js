const { SessionsClient } = require('@google-cloud/dialogflow'); // Corrected import
const path = require('path');
const uuid = require('uuid');
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Only one declaration

// Create a new user
router.post('/add', async (req, res) => {
    console.log('Received request to add a user:', req.body); // Log the incoming request body
    const { name, email, role, section } = req.body;
    try {
        const newUser = new User({ name, email, role, section });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error saving user:', err); // Log any errors that happen
        res.status(400).json({ message: err.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: '❌ Server Error', error: err });
    }
});

// Get a user by ID
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a user by ID
router.put('/update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, email, role, section } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            name,
            email,
            role,
            section
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a user by ID
router.delete('/delete/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Initialize Dialogflow session
const sessionClient = new SessionsClient({
    keyFilename: path.join(__dirname, 'mytaskbot-wnuy-737f0ac4916f.json') // Correct path to your key file
});
const projectId = 'mytaskbot-wnuy'; // Replace with your Dialogflow project ID

// Create a route to handle webhook requests from Dialogflow
router.post('/webhook', async (req, res) => {
    const sessionId = uuid.v4();
    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: req.body.queryText,
                languageCode: 'en-US',
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        res.json({ fulfillmentText: result.fulfillmentText });
    } catch (err) {
        console.error('Error during Dialogflow request', err);
        res.status(500).send('Error');
    }
});

module.exports = router;
