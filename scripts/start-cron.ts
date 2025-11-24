import 'dotenv/config';
import { newsEmailQueue } from '../lib/queue/client';
import cron from 'node-cron';

const logTime = () => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Current UTC time: ${now.getUTCHours()}:${now.getUTCMinutes()}`);
};

console.log('⏰ Starting daily news email cron job...');
logTime();
console.log('📅 Schedule: Every day at 12:00 UTC (noon)');

const scheduleJob = () => {
    console.log('📰 Triggering daily news email job...');
    logTime();
    
    newsEmailQueue.add('send-daily-news', {}, {
        removeOnComplete: true,
        removeOnFail: false
    }).then(() => {
        console.log('✅ Daily news email job queued successfully');
    }).catch((error) => {
        console.error('❌ Failed to queue daily news email:', error);
    });
};

cron.schedule('0 12 * * *', scheduleJob, {
    timezone: 'UTC'
});

console.log('✅ Cron scheduler started');
console.log('💡 Next trigger: 12:00 UTC (check logs for actual execution)');

const nextTrigger = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(12, 0, 0, 0);
    if (next <= now) {
        next.setUTCDate(next.getUTCDate() + 1);
    }
    console.log(`⏰ Next scheduled trigger: ${next.toISOString()}`);
};
nextTrigger();

if (process.env.MANUAL_TRIGGER === 'true') {
    console.log('🔧 Manual trigger mode: executing job immediately...');
    setTimeout(() => {
        scheduleJob();
    }, 2000);
}

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

