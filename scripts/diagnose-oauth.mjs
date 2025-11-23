import 'dotenv/config';

console.log('\n🔍 OAuth 2.0 配置诊断\n');

const checks = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'GOOGLE_REFRESH_TOKEN': process.env.GOOGLE_REFRESH_TOKEN,
    'NODEMAILER_EMAIL': process.env.NODEMAILER_EMAIL,
};

let allGood = true;

for (const [key, value] of Object.entries(checks)) {
    if (value) {
        if (key === 'GOOGLE_CLIENT_SECRET') {
            console.log(`✅ ${key}: ${value.substring(0, 10)}...${value.substring(value.length - 4)}`);
        } else if (key === 'GOOGLE_REFRESH_TOKEN') {
            console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
        } else {
            console.log(`✅ ${key}: ${value}`);
        }
    } else {
        console.log(`❌ ${key}: 未配置`);
        allGood = false;
    }
}

if (!allGood) {
    console.log('\n❌ 请检查 .env 文件中的配置\n');
    process.exit(1);
}

console.log('\n📋 配置检查通过！');
console.log('\n💡 如果仍然遇到 unauthorized_client 错误，可能的原因：');
console.log('   1. Refresh Token 是从不同的 Client ID/Secret 生成的');
console.log('   2. Client ID 和 Client Secret 不匹配');
console.log('   3. 需要重新生成 Refresh Token\n');
console.log('🔧 解决步骤：');
console.log('   1. 访问 https://developers.google.com/oauthplayground');
console.log('   2. 点击右上角设置图标（⚙️）');
console.log('   3. 勾选 "Use your own OAuth credentials"');
console.log('   4. 输入你的 Client ID 和 Client Secret');
console.log('   5. 在左侧选择 "Gmail API v1" → "https://mail.google.com/"');
console.log('   6. 点击 "Authorize APIs"');
console.log('   7. 登录并授权');
console.log('   8. 点击 "Exchange authorization code for tokens"');
console.log('   9. 复制新的 refresh_token 到 .env 文件\n');

