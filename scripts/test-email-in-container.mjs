import 'dotenv/config';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

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

async function testEmail() {
    const email = process.argv[2] || 'harvey@eflabs.tech';
    const name = process.argv[3] || 'Test User';
    
    console.log(`\n📧 测试邮件发送到: ${email}\n`);

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        console.error('❌ OAuth 2.0 配置不完整');
        console.log('需要配置: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
        process.exit(1);
    }

    if (!process.env.NODEMAILER_EMAIL) {
        console.error('❌ NODEMAILER_EMAIL 未配置');
        process.exit(1);
    }

    try {
        console.log('🔑 获取 OAuth 2.0 Access Token...');
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('无法获取 Access Token');
        }
        console.log('✅ Access Token 获取成功\n');

        console.log('📦 创建邮件传输器...');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.NODEMAILER_EMAIL,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });
        console.log('✅ 传输器创建成功\n');

        console.log('📤 发送测试邮件...');
        const mailOptions = {
            from: `"Openstock" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: '🧪 Openstock 邮件配置测试',
            text: `你好 ${name}，这是一封测试邮件，用于验证 Openstock 的邮件配置是否正确。`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>🧪 邮件配置测试</h2>
                    <p>你好 <strong>${name}</strong>，</p>
                    <p>这是一封测试邮件，用于验证 Openstock 的邮件配置是否正确。</p>
                    <p>如果你收到这封邮件，说明 OAuth 2.0 配置已经成功！✅</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">来自 Openstock 邮件系统</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ 邮件发送成功！');
        console.log(`\n📬 邮件详情:`);
        console.log(`   - Message ID: ${info.messageId}`);
        console.log(`   - 收件人: ${email}`);
        console.log(`   - 发件人: ${process.env.NODEMAILER_EMAIL}\n`);
        console.log('💡 请检查邮箱收件箱（包括垃圾邮件文件夹）\n');
    } catch (error) {
        console.error('❌ 邮件发送失败:', error.message);
        if (error.response) {
            console.error('   错误详情:', JSON.stringify(error.response, null, 2));
        }
        console.log('\n💡 可能的原因:');
        console.log('   1. OAuth 2.0 配置错误');
        console.log('   2. Refresh Token 已过期或无效');
        console.log('   3. Gmail API 权限不足');
        console.log('   4. 网络连接问题\n');
        process.exit(1);
    }
}

testEmail();

