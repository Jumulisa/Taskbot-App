const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Create a new task
router.post('/add', async (req, res) => {
    const { userId, taskDescription, status, comments } = req.body;
    try {
        const newTask = new Task({ userId, taskDescription, status, comments });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get tasks by userId
router.get('/:userId', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.params.userId });
        res.json(tasks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update task status (complete/pending)
router.put('/:taskId', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.taskId, req.body, { new: true });
        res.json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
