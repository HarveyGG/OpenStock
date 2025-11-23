import 'dotenv/config';
import { newsEmailQueue } from '../lib/queue/client';
import cron from 'node-cron';

console.log('⏰ Starting daily news email cron job...');
console.log('📅 Schedule: Every day at 12:00 PM (noon)');

cron.schedule('0 12 * * *', async () => {
    console.log('📰 Triggering daily news email job...');
    try {
        await newsEmailQueue.add('send-daily-news', {}, {
            removeOnComplete: true,
            removeOnFail: false
        });
        console.log('✅ Daily news email job queued successfully');
    } catch (error) {
        console.error('❌ Failed to queue daily news email:', error);
    }
}, {
    timezone: 'UTC'
});

console.log('✅ Cron scheduler started');

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

