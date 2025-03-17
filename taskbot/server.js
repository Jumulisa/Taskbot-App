// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const http = require('http');
// const socketIo = require('socket.io');
// const { SessionsClient } = require('@google-cloud/dialogflow');
// const uuid = require('uuid');
// const path = require('path');
// const cron = require('node-cron');
// const axios = require('axios');
// const ObjectId = mongoose.Types.ObjectId;

// // Import models
// const Task = require('./models/Task');
// const Report = require('./models/Report');
// const User = require('./models/User'); // ✅ Ensure User model is imported

// // Import routes
// const userRoutes = require('./routes/userRoutes');
// const taskRoutes = require('./routes/taskRoutes');
// const authRoutes = require('./routes/auth'); // ✅ Corrected auth route

// // Import middleware
// const { authMiddleware } = require('./middleware/midauth'); // ✅ Ensure authentication middleware is used

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//     cors: {
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"]
//     }
// });

// // Environment variables
// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI;
// const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // ✅ Moved Slack webhook to .env

// // Connect to MongoDB
// console.log("📌 Loaded MongoDB URI:", MONGO_URI);
// console.log("🔄 Attempting to connect to MongoDB...");

// mongoose.connect(MONGO_URI)
//     .then(() => console.log("✅ MongoDB Connected Successfully"))
//     .catch(err => console.error("❌ MongoDB Connection Error:", err));

// // Middleware
// app.use(express.json());
// app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST"] }));

// // Routes
// app.use('/api/users', userRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/auth', authRoutes); // ✅ Fixed authentication route

// app.get('/', (req, res) => {
//     res.send("TaskBot API is running...");
// });

// // Socket.io Connection
// io.on('connection', (socket) => {
//     console.log('⚡ New client connected:', socket.id);

//     socket.on('userMessage', (message) => {
//         socket.emit('botResponse', 'Hello! I am here to assist you.');
//     });

//     socket.on('disconnect', () => {
//         console.log('❌ Client disconnected:', socket.id);
//     });
// });

// // Dialogflow Configuration
// const sessionClient = new SessionsClient({
//     keyFilename: path.join(__dirname, 'mytaskbot-wnuy-737f0ac4916f.json'),
// });
// const projectId = 'mytaskbot-wnuy';

// // Webhook Route (with authMiddleware)
// app.post('/webhook', authMiddleware, async (req, res) => {
//     const sessionId = uuid.v4();
//     const sessionPath = sessionClient.sessionPath(projectId, sessionId);

//     const request = {
//         session: sessionPath,
//         queryInput: {
//             text: {
//                 text: req.body.queryText,
//                 languageCode: 'en-US',
//             },
//         },
//     };

//     try {
//         const responses = await sessionClient.detectIntent(request);
//         const result = responses[0].queryResult;
//         const action = result.action;

//         if (action === 'show.pending.tasks') {
//             const userId = req.body.userId;
//             const tasks = await Task.find({ userId, status: 'pending' });
//             let taskResponse = tasks.length ? 'Here are your pending tasks:' : 'No pending tasks found.';
//             tasks.forEach(task => taskResponse += `\n- ${task.taskDescription}`);
//             return res.json({ fulfillmentText: taskResponse });
//         }

//         if (action === 'complete.task') {
//             const taskId = req.body.taskId;
//             await Task.findByIdAndUpdate(taskId, { status: 'completed' });
//             return res.json({ fulfillmentText: 'Your task has been marked as complete.' });
//         }

//         res.json({ fulfillmentText: result.fulfillmentText });
//     } catch (err) {
//         console.error('❌ Error during Dialogflow request:', err);
//         res.status(500).json({ error: 'Error processing the request' });
//     }
// });

// // ✅ Generate and Send Daily Report Function
// const generateAndSendReport = async () => {
//     try {
//         const users = await User.find(); // ✅ Fetch all users dynamically
//         for (const user of users) {
//             const dailyReport = await generateDailyReport(user._id, user.section);
//             await sendReportEmail(dailyReport);
//         }
//     } catch (error) {
//         console.error("❌ Error generating and sending report:", error);
//     }
// };

// // ✅ Generate Daily Report
// const generateDailyReport = async (userId, section) => {
//     const tasks = await Task.find({ userId, date: { $gte: new Date().setHours(0, 0, 0, 0) } });
//     const completedTasks = tasks.filter(task => task.status === 'completed');
//     const pendingTasks = tasks.filter(task => task.status === 'pending');

//     let completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

//     const report = new Report({
//         userId,
//         section,
//         completedTasks: completedTasks.map(task => task.taskDescription),
//         pendingTasks: pendingTasks.map(task => task.taskDescription),
//         taskCompletionRate: completionRate,
//         taskTrendAnalysis: `This section has ${completedTasks.length} completed tasks out of ${tasks.length}.`
//     });

//     await report.save();
//     return report;
// };

// // ✅ Send Report Email
// const sendReportEmail = async (report) => {
//     const emailContent = `
//         Daily Report for Section: ${report.section}
//         Completed Tasks: ${report.completedTasks.join(', ')}
//         Pending Tasks: ${report.pendingTasks.join(', ')}
//         Completion Rate: ${report.taskCompletionRate}%
//         Analysis: ${report.taskTrendAnalysis}
//     `;
    
//     // Replace this with an actual email-sending service
//     console.log(`Sending daily report to Section Manager and HOD:\n${emailContent}`);
// };

// // ✅ SLACK WEBHOOK FUNCTION
// const sendToSlack = async (message) => {
//     try {
//         await axios.post(
//             "https://hooks.slack.com/services/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",
//             { text: message });
//         console.log('✅ Notification sent to Slack');
//     } catch (error) {
//         console.error('❌ Error sending message to Slack:', error);
//     }
// };

// // Example: Send a notification when the server starts
// sendToSlack("🚀 TaskBot is now running!");

// // ✅ Pending Tasks Check (every day at 3 PM)
// const checkForPendingTasks = async () => {
//     const pendingTasks = await Task.find({ status: 'pending' });

//     if (pendingTasks.length > 0) {
//         await sendToSlack('There are pending tasks that need your attention. Please follow up.');
//     }
// };

// // Schedule pending task reminders
// cron.schedule('0 15 * * *', async () => {
//     await checkForPendingTasks();
//     console.log('✅ Pending tasks follow-up reminder sent!');
// });

// // Start server
// server.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     generateAndSendReport(); // ✅ Run report generation on startup
// });

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
            const taskId = req.body.taskId;
            await Task.findByIdAndUpdate(taskId, { status: 'completed' });
            return res.json({ fulfillmentText: 'Your task has been marked as complete.' });
        }
        
        res.json({ fulfillmentText: result.fulfillmentText });
    } catch (err) {
        next(err); // Pass the error to error-handling middleware
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err.message, "\nStack Trace:", err.stack);
    res.status(500).json({ message: err.message, stack: err.stack });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
