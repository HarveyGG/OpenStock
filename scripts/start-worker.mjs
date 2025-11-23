import 'dotenv/config';
import { spawn } from 'child_process';

console.log('🚀 Starting BullMQ workers...');

const worker = spawn('npx', ['tsx', 'lib/queue/workers.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
});

console.log('📧 Welcome email worker: running');
console.log('📰 News email worker: running');

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

