// const express = require('express');
// const { generateDailyReport, generateWeeklyReport, generateMonthlyReport } = require('../services/reportService');
// const router = express.Router();

// // Endpoint to generate daily report
// router.post('/generate-daily', async (req, res) => {
//     const { section } = req.body;
//     const report = await generateDailyReport(section);
//     res.status(200).json(report);
// });

// // Endpoint to generate weekly report
// router.post('/generate-weekly', async (req, res) => {
//     const { section } = req.body;
//     const report = await generateWeeklyReport(section);
//     res.status(200).json(report);
// });

// // Endpoint to generate monthly report
// router.post('/generate-monthly', async (req, res) => {
//     const { section } = req.body;
//     const report = await generateMonthlyReport(section);
//     res.status(200).json(report);
// });

// module.exports = router;
const express = require('express');
const { generateDailyReport, generateWeeklyReport, generateMonthlyReport } = require('../services/reportService');
const { authMiddleware, roleMiddleware } = require('../middleware/midauth');  // Make sure the path is correct for your middleware
const Report = require('../models/Report');

const router = express.Router();

// Endpoint to generate daily report
router.post('/generate-daily', authMiddleware, async (req, res) => {  // Add authentication middleware
    const { section } = req.body;
    const report = await generateDailyReport(section);
    res.status(200).json(report);
});

// Endpoint to generate weekly report
router.post('/generate-weekly', authMiddleware, async (req, res) => {  // Add authentication middleware
    const { section } = req.body;
    const report = await generateWeeklyReport(section);
    res.status(200).json(report);
});

// Endpoint to generate monthly report
router.post('/generate-monthly', authMiddleware, async (req, res) => {  // Add authentication middleware
    const { section } = req.body;
    const report = await generateMonthlyReport(section);
    res.status(200).json(report);
});

// Get reports (Only accessible by managers & HODs)
router.get('/', authMiddleware, roleMiddleware(['manager', 'hod']), async (req, res) => {
    try {
        const reports = await Report.find();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Submit a report (Only staff can submit reports)
router.post('/submit', authMiddleware, roleMiddleware(['staff']), async (req, res) => {
    try {
        const { section, completedTasks, pendingTasks } = req.body;
        const newReport = new Report({
            section,
            completedTasks,
            pendingTasks,
            user: req.user.userId
        });
        await newReport.save();
        res.json({ msg: 'Report submitted successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
