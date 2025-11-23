import 'dotenv/config';
import { spawn } from 'child_process';

console.log('🚀 Starting OpenStock services...\n');

const nextjs = spawn('pnpm', ['start'], {
    stdio: 'inherit',
    shell: true
});

const worker = spawn('node', ['scripts/start-worker.mjs'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
});

const cron = spawn('npx', ['tsx', 'scripts/start-cron.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down services...');
    nextjs.kill();
    worker.kill();
    cron.kill();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    nextjs.kill();
    worker.kill();
    cron.kill();
    process.exit(0);
});

nextjs.on('exit', (code) => {
    console.error(`Next.js exited with code ${code}`);
    process.exit(code || 1);
});

