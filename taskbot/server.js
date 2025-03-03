require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { SessionsClient } = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const path = require('path');
const Task = require('./models/Task'); // Only import it once
const Report = require('./models/Report');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST"] }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log("📌 Loaded MongoDB URI:", MONGO_URI);
console.log("🔄 Attempting to connect to MongoDB...");

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// **IMPORT ROUTES**
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

// **USE ROUTES**
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// **DEFAULT ROUTE**
app.get('/', (req, res) => {
    res.send("TaskBot API is running...");
});

// ✅ SOCKET.IO Event Handling
io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);

    socket.on('userMessage', (message) => {
        socket.emit('botResponse', 'Hello! I am here to assist you.');
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// ✅ DIALOGFLOW SETUP
const sessionClient = new SessionsClient({
    keyFilename: path.join(__dirname, 'mytaskbot-wnuy-737f0ac4916f.json'),
});
const projectId = 'mytaskbot-wnuy';

// ✅ WEBHOOK ROUTE
app.post('/webhook', async (req, res) => {
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
        console.error('❌ Error during Dialogflow request:', err);
        res.status(500).json({ error: 'Error processing the request' });
    }
});

// ✅ Generate and Send Daily Report Function
const generateAndSendReport = async () => {
    const userId = 'someUserId';  // Replace with actual userId or dynamic value
    const section = 'someSection';  // Replace with actual section or dynamic value

    try {
        const dailyReport = await generateDailyReport(userId, section);
        await sendReportEmail(dailyReport);
    } catch (error) {
        console.error("❌ Error generating and sending report:", error);
    }
};

// ✅ Generate Daily Report
const generateDailyReport = async (userId, section) => {
    const tasks = await Task.find({ userId, date: { $gte: new Date().setHours(0, 0, 0, 0) } });
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const pendingTasks = tasks.filter(task => task.status === 'pending');

    const completionRate = (completedTasks.length / tasks.length) * 100;

    const report = new Report({
        userId,
        section,
        completedTasks: completedTasks.map(task => task.taskDescription),
        pendingTasks: pendingTasks.map(task => task.taskDescription),
        taskCompletionRate: completionRate,
        taskTrendAnalysis: `This section has ${completedTasks.length} completed tasks out of ${tasks.length}.`
    });

    await report.save();
    return report;
};

// ✅ Send Report Email
const sendReportEmail = async (report) => {
    const emailContent = `
        Daily Report for Section: ${report.section}
        Completed Tasks: ${report.completedTasks.join(', ')}
        Pending Tasks: ${report.pendingTasks.join(', ')}
        Completion Rate: ${report.taskCompletionRate}%
        Analysis: ${report.taskTrendAnalysis}
    `;
    
    // Send email (replace this with an actual email-sending service)
    console.log(`Sending daily report to Section Manager and HOD:\n${emailContent}`);
};

// ✅ START SERVER
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    // Call the report function after server starts
    generateAndSendReport();
});

// Generate Weekly Report
const generateWeeklyReport = async (section) => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());  // Get start of the current week

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 6);  // Get end of the current week

    const dailyReports = await Report.find({
        section,
        date: { $gte: startOfWeek, $lte: endOfWeek }
    });

    const completedTasks = [];
    const pendingTasks = [];
    let totalCompletionRate = 0;
    let taskTrends = {};

    dailyReports.forEach(report => {
        completedTasks.push(...report.completedTasks);
        pendingTasks.push(...report.pendingTasks);
        totalCompletionRate += report.taskCompletionRate;

        // Aggregate task trends
        report.taskTrendAnalysis.split(' ').forEach(word => {
            taskTrends[word] = (taskTrends[word] || 0) + 1;
        });
    });

    const averageCompletionRate = totalCompletionRate / dailyReports.length;

    const weeklyReport = new Report({
        section,
        completedTasks,
        pendingTasks,
        taskCompletionRate: averageCompletionRate,
        taskTrendAnalysis: `Top trends: ${Object.keys(taskTrends).join(', ')}`
    });

    // Save weekly report to database
    await weeklyReport.save();

    // Send the weekly report to relevant section managers or HODs
    // (We’ll assume there’s an email service configured here to send the report)

    return weeklyReport;
};
