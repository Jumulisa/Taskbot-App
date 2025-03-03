const cron = require('node-cron');
const axios = require('axios'); // For sending reminders via Teams or Email

// Example function to send reminders
const sendReminder = async (message) => {
    try {
        // You can integrate Teams here or send an email
        // Here, you will call a function to send reminder to Teams or Email (as we discussed earlier)
        await sendToTeams(message); // You can replace this with your notification logic
    } catch (error) {
        console.error('Error sending reminder:', error);
    }
};

// Set up a cron job for daily morning reminder (8:00 AM)
cron.schedule('0 8 * * *', async () => {
    const message = "Good morning! Please report what you plan to do today.";
    await sendReminder(message);
    console.log('Morning reminder sent!');
});

// Set up a cron job for daily evening reminder (5:00 PM)
cron.schedule('0 17 * * *', async () => {
    const message = "End of the day! Please report what tasks you completed today and any pending tasks.";
    await sendReminder(message);
    console.log('Evening reminder sent!');
});
