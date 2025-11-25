import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendWelcomeEmail, sendNewsSummaryEmail } from '@/lib/nodemailer';
import { getAllUsersForNewsEmail } from '@/lib/actions/user.actions';
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import { getFormattedTodayDate } from '@/lib/utils';
import { PERSONALIZED_WELCOME_EMAIL_PROMPT, NEWS_SUMMARY_EMAIL_PROMPT } from '@/lib/inngest/prompts';
import { createAIProvider } from '@/lib/ai/factory';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const aiProvider = createAIProvider();

const generateWelcomeIntro = async (userProfile: string): Promise<string> => {
    if (!aiProvider) {
        return 'Thanks for joining Openstock. You now have the tools to track markets and make smarter moves.';
    }

    try {
        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile);
        const text = await aiProvider.generateText(prompt);
        return text || 'Thanks for joining Openstock. You now have the tools to track markets and make smarter moves.';
    } catch (error) {
        console.error('Failed to generate welcome intro:', error);
        return 'Thanks for joining Openstock. You now have the tools to track markets and make smarter moves.';
    }
};

const formatNewsAsHTML = (articles: any[]): string => {
    if (!articles || articles.length === 0) {
        return '<p>No market news available today.</p>';
    }

    let html = '<div style="margin-bottom: 20px;">';
    articles.forEach((article, index) => {
        const date = article.datetime ? new Date(article.datetime * 1000).toLocaleDateString() : 'Today';
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background-color: #212328; border-radius: 8px; border-left: 3px solid #FDD458;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #FDD458;">
                    ${article.headline || 'Market News'}
                </h3>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #9ca3af;">
                    ${article.summary || article.headline || ''}
                </p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    ${date} | ${article.source || 'Market News'}
                </p>
                ${article.url ? `<p style="margin: 8px 0 0 0;"><a href="${article.url}" style="color: #FDD458; text-decoration: none;">Read more →</a></p>` : ''}
            </div>
        `;
    });
    html += '</div>';
    return html;
};

const generateNewsSummary = async (articles: any[]): Promise<string> => {
    if (!aiProvider) {
        return formatNewsAsHTML(articles);
    }

    try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));
        const text = await aiProvider.generateText(prompt);
        return text || formatNewsAsHTML(articles);
    } catch (error) {
        console.error('Failed to generate news summary, using formatted news list:', error);
        return formatNewsAsHTML(articles);
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
                    : '<p>No market news available today.</p>';
                
                if (newsContent && newsContent.trim()) {
                    await sendNewsSummaryEmail({ 
                        email: user.email, 
                        date, 
                        newsContent 
                    });
                    console.log(`✅ News email sent to: ${user.email}`);
                } else {
                    console.log(`⚠️ Skipping email to ${user.email}: empty news content`);
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

