try {
  require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
} catch {
  // dotenv is optional in production containers; Cloud Run injects env vars.
}
try {
  const fs = require('fs');
  const path = require('path');
  const envCloudRunPath = path.join(process.cwd(), '.cloudrun.env');
  if (fs.existsSync(envCloudRunPath)) {
    try { require('dotenv').config({ path: envCloudRunPath }); } catch {}
  }
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    try { require('dotenv').config({ path: envLocalPath, override: true }); } catch {}
  }
} catch {}

const { execSync, spawn } = require('child_process');
const path = require('path');

function runPrismaPush() {
  // New guard: only run when explicitly enabled
  const shouldPush = String(process.env.PRISMA_PUSH_ON_START || '').toLowerCase() === 'true';
  if (!shouldPush) {
    console.log('[startup] PRISMA_PUSH_ON_START=false; skipping prisma db push');
    return;
  }

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
  const port = process.env.PORT || '3000';
  process.env.PORT = port;
  process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
  console.log(`[startup] Starting server on HOSTNAME=${process.env.HOSTNAME} PORT=${port}...`);

  // Prefer Next standalone server.js when available (matches Dockerfile copy)
  const serverJsPath = path.join(process.cwd(), 'server.js');
  let child;
  if (require('fs').existsSync(serverJsPath)) {
    child = spawn('node', [serverJsPath], { stdio: 'inherit' });
  } else {
    // Fallback to Next CLI if standalone not present
    const nextBin = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
    const args = ['start', '-p', port, '-H', process.env.HOSTNAME];
    child = spawn(nextBin, args, { stdio: 'inherit' });
  }

  child.on('exit', (code) => {
    console.log(`[startup] App exited with code ${code}`);
    process.exit(code);
  });
}

runPrismaPush();
maybeSeedDatabase();
startServer();