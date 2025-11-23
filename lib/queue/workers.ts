import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendWelcomeEmail, sendNewsSummaryEmail } from '@/lib/nodemailer';
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { getFormattedTodayDate } from '@/lib/utils';
import { PERSONALIZED_WELCOME_EMAIL_PROMPT, NEWS_SUMMARY_EMAIL_PROMPT } from '@/lib/inngest/prompts';
import { GoogleGenerativeAI } from '@google/generative-ai';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const generateWelcomeIntro = async (userProfile: string): Promise<string> => {
    if (!genAI) {
        return 'Thanks for joining Openstock. You now have the tools to track markets and make smarter moves.';
    }

    try {
        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return text.trim() || 'Thanks for joining Openstock. You now have the tools to track markets and make smarter moves.';
    } catch (error) {
        console.error('Failed to generate welcome intro:', error);
        return 'Thanks for joining Openstock. You now have the tools to track markets and make smarter moves.';
    }
};

const generateNewsSummary = async (articles: any[]): Promise<string> => {
    if (!genAI) {
        return 'No market news available today.';
    }

    try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return text.trim() || 'No market news available today.';
    } catch (error) {
        console.error('Failed to generate news summary:', error);
        return 'No market news available today.';
    }
};

export const welcomeEmailWorker = new Worker(
    'welcome-email',
    async (job) => {
        const { email, name, country, investmentGoals, riskTolerance, preferredIndustry } = job.data;
        
        const userProfile = `
            - Country: ${country}
            - Investment goals: ${investmentGoals}
            - Risk tolerance: ${riskTolerance}
            - Preferred industry: ${preferredIndustry}
        `;

        const intro = await generateWelcomeIntro(userProfile);
        await sendWelcomeEmail({ email, name, intro });
        
        return { success: true, email };
    },
    { connection }
);

export const newsEmailWorker = new Worker(
    'news-email',
    async (job) => {
        const users = await getAllUsersForNewsEmail();
        
        if (!users || users.length === 0) {
            return { success: false, message: 'No users found' };
        }

        const perUser: Array<{ user: any; articles: any[] }> = [];
        
        for (const user of users) {
            try {
                const symbols = await getWatchlistSymbolsByEmail(user.email);
                let articles = await getNews(symbols);
                articles = (articles || []).slice(0, 6);
                
                if (!articles || articles.length === 0) {
                    articles = await getNews();
                    articles = (articles || []).slice(0, 6);
                }
                
                perUser.push({ user, articles });
            } catch (e) {
                console.error('Error preparing user news:', user.email, e);
                perUser.push({ user, articles: [] });
            }
        }

        const date = getFormattedTodayDate();
        
        for (const { user, articles } of perUser) {
            try {
                const newsContent = articles.length > 0 
                    ? await generateNewsSummary(articles)
                    : 'No market news available today.';
                
                if (newsContent && newsContent !== 'No market news available today.') {
                    await sendNewsSummaryEmail({ 
                        email: user.email, 
                        date, 
                        newsContent 
                    });
                }
            } catch (e) {
                console.error('Failed to send news email to:', user.email, e);
            }
        }

        return { success: true, usersProcessed: users.length };
    },
    { connection }
);

welcomeEmailWorker.on('completed', (job) => {
    console.log(`Welcome email sent: ${job.data.email}`);
});

welcomeEmailWorker.on('failed', (job, err) => {
    console.error(`Welcome email failed for ${job?.data?.email}:`, err);
});

newsEmailWorker.on('completed', (job) => {
    console.log(`News emails sent: ${job.returnvalue?.usersProcessed || 0} users`);
});

newsEmailWorker.on('failed', (job, err) => {
    console.error('News email job failed:', err);
});

