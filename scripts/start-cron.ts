import 'dotenv/config';
import { newsEmailQueue } from '../lib/queue/client';
import cron from 'node-cron';
import Redis from 'ioredis';

const logTime = () => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Current UTC time: ${now.getUTCHours()}:${now.getUTCMinutes()}`);
};

console.log('⏰ Starting daily news email cron job...');
logTime();
console.log('📅 Schedule: Every day at 12:00 PM Vancouver time (noon)');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const checkAndSendMissedEmail = async (): Promise<void> => {
    const now = new Date();
    const vancouverTimeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Vancouver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(now);
    
    const vancouverDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Vancouver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    
    const parts = vancouverTimeStr.split(', ');
    const timePart = parts.length > 1 ? parts[1] : parts[0];
    const [hour] = timePart.split(':').map(Number);
    
    const currentHour = hour;
    const lastSentDate = await redis.get('last-news-email-date');
    
    const shouldHaveSent = currentHour >= 12;
    const alreadySent = lastSentDate === vancouverDateStr;
    const hasMissedDays = lastSentDate && lastSentDate < vancouverDateStr;
    
    const lockKey = `news-email-sent-${vancouverDateStr}`;
    const lockExists = await redis.get(lockKey);
    
    console.log(`🔍 Checking missed email status:`);
    console.log(`   Current Vancouver time: ${vancouverTimeStr}`);
    console.log(`   Today's date (Vancouver): ${vancouverDateStr}`);
    console.log(`   Last sent date: ${lastSentDate || 'never'}`);
    console.log(`   Should have sent today: ${shouldHaveSent}`);
    console.log(`   Already sent today: ${alreadySent}`);
    console.log(`   Has missed days: ${hasMissedDays}`);
    console.log(`   Lock key exists: ${lockExists ? 'yes' : 'no'}`);
    
    if (alreadySent) {
        console.log('✅ Email already sent today, skipping check (will continue monitoring for tomorrow)');
    } else if (shouldHaveSent || hasMissedDays) {
        if (lockExists && lockExists === 'sent') {
            console.log('⚠️ Lock key exists but last-news-email-date is outdated. Clearing lock and retrying...');
            await redis.del(lockKey);
        }
        console.log('📧 Detected missed email! Triggering catch-up send...');
        await scheduleJob();
    } else {
        console.log('⏳ Not yet time to send (before 12:00 PM), will continue checking');
    }
};

const scheduleJob = async () => {
    const now = new Date();
    const vancouverDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Vancouver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    
    const jobId = `daily-news-${vancouverDateStr}`;
    const queueLockKey = `news-email-queue-lock-${vancouverDateStr}`;
    
    const lockAcquired = await redis.set(queueLockKey, Date.now().toString(), 'EX', 300, 'NX');
    if (!lockAcquired) {
        console.log(`⏭️ Another process is already queuing job for ${vancouverDateStr}, skipping`);
        return;
    }
    
    console.log('📰 Triggering daily news email job...');
    logTime();
    
    try {
        const existingJob = await newsEmailQueue.getJob(jobId);
        if (existingJob) {
            const state = await existingJob.getState();
            if (state === 'active' || state === 'waiting' || state === 'delayed' || state === 'completed') {
                console.log(`⏭️ Job ${jobId} already exists with state: ${state}, skipping duplicate`);
                return;
            }
        }
        
        await newsEmailQueue.add('send-daily-news', {}, {
            jobId,
            removeOnComplete: false,
            removeOnFail: false
        });
        console.log(`✅ Daily news email job queued successfully with jobId: ${jobId}`);
    } catch (error) {
        console.error('❌ Failed to queue daily news email:', error);
    }
};

cron.schedule('0 12 * * *', scheduleJob, {
    timezone: 'America/Vancouver'
});

console.log('✅ Cron scheduler started');
console.log('💡 Next trigger: 12:00 PM Vancouver time (check logs for actual execution)');

const nextTrigger = () => {
    const now = new Date();
    const vancouverTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Vancouver',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(now);
    
    const hour = parseInt(vancouverTime.split(':')[0]);
    const isToday = hour < 12;
    
    const displayDate = isToday ? 'today' : 'tomorrow';
    console.log(`⏰ Next scheduled trigger: ${displayDate} at 12:00 PM (Vancouver time)`);
};
nextTrigger();

let checkInterval: NodeJS.Timeout | null = null;

const startPeriodicCheck = async () => {
    await checkAndSendMissedEmail();
    
    if (!checkInterval) {
        console.log('🔄 Starting periodic check every 10 minutes (will continue running daily)...');
        checkInterval = setInterval(async () => {
            await checkAndSendMissedEmail();
        }, 10 * 60 * 1000);
    }
};

setTimeout(async () => {
    await startPeriodicCheck();
}, 3000);

if (process.env.MANUAL_TRIGGER === 'true') {
    console.log('🔧 Manual trigger mode: executing job immediately...');
    setTimeout(() => {
        scheduleJob();
    }, 5000);
}

process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (checkInterval) {
        clearInterval(checkInterval);
    }
    await redis.quit();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    if (checkInterval) {
        clearInterval(checkInterval);
    }
    await redis.quit();
    process.exit(0);
});

