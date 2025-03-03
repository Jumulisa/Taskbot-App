const Task = require('../models/Task');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ['staff', 'manager', 'hod', 'admin']
    },
    section: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);
