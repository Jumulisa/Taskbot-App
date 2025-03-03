const express = require('express');
const { generateDailyReport, generateWeeklyReport, generateMonthlyReport } = require('../services/reportService');
const router = express.Router();

// Endpoint to generate daily report
router.post('/generate-daily', async (req, res) => {
    const { section } = req.body;
    const report = await generateDailyReport(section);
    res.status(200).json(report);
});

// Endpoint to generate weekly report
router.post('/generate-weekly', async (req, res) => {
    const { section } = req.body;
    const report = await generateWeeklyReport(section);
    res.status(200).json(report);
});

// Endpoint to generate monthly report
router.post('/generate-monthly', async (req, res) => {
    const { section } = req.body;
    const report = await generateMonthlyReport(section);
    res.status(200).json(report);
});

module.exports = router;
