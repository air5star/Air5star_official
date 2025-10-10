const { execSync, spawn } = require('child_process');

function runPrismaPush() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.warn('[startup] DATABASE_URL not set; skipping prisma db push');
    return;
  }
  try {
    console.log('[startup] Running prisma db push to ensure schema is applied...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('[startup] Prisma db push completed.');
  } catch (err) {
    console.error('[startup] Prisma db push failed:', err?.message || err);
  }
}

function startServer() {
  console.log('[startup] Starting Next.js server...');
  const child = spawn('node', ['server.js'], { stdio: 'inherit' });
  child.on('exit', (code) => {
    console.log(`[startup] Server exited with code ${code}`);
    process.exit(code);
  });
}

runPrismaPush();
startServer();