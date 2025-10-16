const { execSync, spawn } = require('child_process');
const path = require('path');

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

function maybeSeedDatabase() {
  const shouldSeed = String(process.env.SEED_DB || '').toLowerCase() === 'true';
  const seedScript = process.env.SEED_SCRIPT || 'scripts/seed-all-products.js';
  if (!shouldSeed) {
    console.log('[startup] SEED_DB=false; skipping seed step');
    return;
  }

  const scriptPath = path.join(process.cwd(), seedScript);
  try {
    console.log(`[startup] Seeding database with: ${scriptPath}`);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log('[startup] Seed completed successfully.');
  } catch (err) {
    console.error('[startup] Seed failed:', err?.message || err);
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
maybeSeedDatabase();
startServer();