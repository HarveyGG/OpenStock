import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';

async function deleteUser() {
    const email = process.argv[2];
    
    if (!email) {
        console.error('❌ 请提供邮箱地址');
        console.log('用法: node scripts/delete-user.mjs <email>');
        process.exit(1);
    }

    let uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI 未配置');
        process.exit(1);
    }

    const isInDocker = fs.existsSync('/.dockerenv');
    
    if (!isInDocker && uri.includes('mongodb:27017')) {
        uri = uri.replace('mongodb:27017', 'localhost:27018');
        console.log('💡 检测到本地环境，使用 localhost:27018 连接 MongoDB\n');
    } else if (isInDocker) {
        console.log('💡 检测到容器环境，使用 Docker 网络中的 MongoDB\n');
    }

    try {
        console.log(`\n🔌 连接数据库...`);
        await mongoose.connect(uri, { bufferCommands: false });
        console.log('✅ 数据库连接成功\n');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('数据库连接失败');
        }

        console.log(`🗑️  正在删除用户: ${email}`);
        
        const userCollection = db.collection('user');
        const sessionCollection = db.collection('session');
        const watchlistCollection = db.collection('watchlist');

        const user = await userCollection.findOne({ email });
        
        if (!user) {
            console.log('⚠️  用户不存在');
            await mongoose.connection.close();
            process.exit(0);
        }

        const userId = user.id || user._id?.toString();
        
        await Promise.all([
            userCollection.deleteOne({ email }),
            sessionCollection.deleteMany({ userId }),
            watchlistCollection.deleteMany({ email })
        ]);

        console.log('✅ 用户数据已删除');
        console.log(`   - 用户账号: ${email}`);
        console.log(`   - 会话数据: 已清理`);
        console.log(`   - 自选列表: 已清理\n`);
        console.log('💡 现在可以使用这个邮箱重新注册了\n');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ 删除失败:', error);
        await mongoose.connection.close().catch(() => {});
        process.exit(1);
    }
}

deleteUser();

