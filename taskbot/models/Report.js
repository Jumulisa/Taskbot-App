const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    section: String,
    date: { type: Date, default: Date.now },
    completedTasks: [{ type: String }],
    pendingTasks: [{ type: String }],
    comments: String,
    taskCompletionRate: Number,  // e.g., percentage of tasks completed
    taskTrendAnalysis: String,   // Insights or bottleneck analysis
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
