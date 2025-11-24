import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';

async function main() {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('ERROR: MONGODB_URI must be set in .env');
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
        const startedAt = Date.now();
        await mongoose.connect(uri, { bufferCommands: false });
        const elapsed = Date.now() - startedAt;

        const dbName = mongoose.connection?.name || '(unknown)';
        const host = mongoose.connection?.host || '(unknown)';

        console.log(`OK: Connected to MongoDB [db="${dbName}", host="${host}", time=${elapsed}ms]`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('ERROR: Database connection failed');
        console.error(err);
        try { await mongoose.connection.close(); } catch {}
        process.exit(1);
    }
}

main();