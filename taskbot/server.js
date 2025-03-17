require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const ObjectId = mongoose.Types.ObjectId;

// Import models
const Task = require('./models/Task');
const Report = require('./models/Report');
const User = require('./models/User');

// Import routes
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/auth');

// Import middleware
const { authMiddleware } = require('./middleware/midauth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Connect to MongoDB
console.log("\ud83d\udccc Loaded MongoDB URI:", MONGO_URI);
console.log("\ud83d\udd04 Attempting to connect to MongoDB...");

mongoose.connect(MONGO_URI)
    .then(() => console.log("\u2705 MongoDB Connected Successfully"))
    .catch(err => console.error("\u274c MongoDB Connection Error:", err));

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST"] }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send("TaskBot API is running...");
});


// remove this sockets part: willy
// Socket.io Connection
io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);
    socket.on('userMessage', (message) => {
        socket.emit('botResponse', 'Hello! I am here to assist you.');
    });
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// remove this part as well - willy
// Dialogflow Configuration
const sessionClient = new SessionsClient({
    keyFilename: path.join(__dirname, 'mytaskbot-wnuy-737f0ac4916f.json'),
});
const projectId = 'mytaskbot-wnuy';

// Webhook Route (with authMiddleware)
app.post('/webhook', authMiddleware, async (req, res, next) => {
    try {
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
        
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        const action = result.action;
        
        if (action === 'show.pending.tasks') {
            const userId = req.body.userId;
            const tasks = await Task.find({ userId, status: 'pending' });
            let taskResponse = tasks.length ? 'Here are your pending tasks:' : 'No pending tasks found.';
            tasks.forEach(task => taskResponse += `\n- ${task.taskDescription}`);
            return res.json({ fulfillmentText: taskResponse });
        }
        
        if (action === 'complete.task') {

            // test comment
            const taskId = req.body.taskId;
            await Task.findByIdAndUpdate(taskId, { status: 'completed' });
            return res.json({ fulfillmentText: 'Your task has been marked as complete.' });
        }
        
        res.json({ fulfillmentText: result.fulfillmentText });
    } catch (err) {
        next(err); // Pass the error to error-handling middleware
    }
});


// this part should be at the top of all endpoints
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err.message, "\nStack Trace:", err.stack);
    res.status(500).json({ message: err.message, stack: err.stack });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});


// remove all unnecessary logs: ex: mongo DB URI