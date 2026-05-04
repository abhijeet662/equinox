import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import 'dotenv/config';

import { errorHandler } from './middleware/errorHandler';

import { startSlaWatchdog, triggerSlaWatchdogNow } from './services/sla-watchdog.service';
import { startDailyDigest, triggerDailyDigestNow } from './services/daily-digest.service';
import { startFeaturedExpiryService, runFeaturedExpiryScan } from './services/featured-expiry.service';

import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import providersRoutes from './routes/providers.routes';
import tasksRoutes from './routes/tasks.routes';
import contractsRoutes from './routes/contracts.routes';
import invoicesRoutes from './routes/invoices.routes';
import walletRoutes from './routes/wallet.routes';
import complaintsRoutes from './routes/complaints.routes';
import reviewsRoutes from './routes/reviews.routes';
import notificationsRoutes from './routes/notifications.routes';
import kpiRoutes from './routes/kpi.routes';
import leaveRoutes from './routes/leave.routes';
import aiRoutes from './routes/ai.routes';
import meetingsRoutes from './routes/meetings.routes';
import mandatesRoutes from './routes/mandates.routes';
import lmsRoutes from './routes/lms.routes';
import leadsRoutes from './routes/leads.routes';
import contactsRoutes from './routes/contacts.routes';
import analyticsRoutes from './routes/analytics.routes';
import assetsRoutes from './routes/assets.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── SECURITY & PARSING ───────────────────────────────────────────────────────

app.use(helmet());

// In development allow any localhost port so Vite's auto-port-increment never
// causes CORS failures. In production lock to CLIENT_URL.
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || 'http://localhost:5173'
    : (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
        const ok = !origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        cb(ok ? null : new Error('CORS: origin not allowed'), ok);
      };

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── LOGGING ──────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', globalLimiter);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Equinox API is running', timestamp: new Date().toISOString() });
});

// ─── ADMIN: MANUAL SERVICE TRIGGERS ──────────────────────────────────────────
// These endpoints let an admin manually fire background services without
// waiting for the next scheduled tick. Useful during demos and debugging.
// No auth middleware here intentionally — protect via network/firewall in prod
// or add authenticate + authorize('ADMIN') if you want HTTP-level guards.

app.post('/admin/trigger/sla-watchdog', (_req, res) => {
  triggerSlaWatchdogNow()
    .then((result) => res.json({ success: true, ...result }))
    .catch((err) => res.status(500).json({ success: false, message: String(err) }));
});

app.post('/admin/trigger/daily-digest', (_req, res) => {
  triggerDailyDigestNow()
    .then((result) => res.json({ success: true, ...result }))
    .catch((err) => res.status(500).json({ success: false, message: String(err) }));
});

app.post('/admin/trigger/featured-expiry', (_req, res) => {
  runFeaturedExpiryScan()
    .then((result) => res.json({ success: true, ...result }))
    .catch((err) => res.status(500).json({ success: false, message: String(err) }));
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/mandates', mandatesRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assets', assetsRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────

app.use(errorHandler);

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Equinox API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);

  // ── Start background services ────────────────────────────────────────────
  // Only run in non-test environments to avoid polluting unit test output
  if (process.env.NODE_ENV !== 'test') {
    startSlaWatchdog();           // scans every 15 min; runs immediately on boot
    startDailyDigest();           // fires every day at 07:00 (configurable via DAILY_DIGEST_CRON)
    startFeaturedExpiryService(); // expires free 180-day featured window daily at 01:00
  }
});

export default app;
