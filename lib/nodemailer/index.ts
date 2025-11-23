import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

const getAccessToken = async () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const { token } = await oauth2Client.getAccessToken();
    return token;
};

const createTransporter = async () => {
    const useOAuth2 = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN;
    
    if (useOAuth2) {
        const accessToken = await getAccessToken();
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.NODEMAILER_EMAIL!,
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
                accessToken: accessToken!,
            },
        });
    } else {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_EMAIL!,
                pass: process.env.NODEMAILER_PASSWORD!,
            }
        });
    }
};

let transporterCache: nodemailer.Transporter | null = null;

const getTransporter = async () => {
    if (!transporterCache) {
        transporterCache = await createTransporter();
    }
    return transporterCache;
};

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const transporter = await getTransporter();
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Openstock" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `Welcome to Openstock - your open-source stock market toolkit!`,
        text: 'Thanks for joining Openstock, an initiative by open dev society',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const transporter = await getTransporter();
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Openstock" <${process.env.NODEMAILER_EMAIL}>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Openstock`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};