import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createAttendanceRouter, attendanceErrorHandler } from './attendance-api.mjs';

export function createAttendanceApp({ db, auth, fieldValue = FieldValue, timestamp = Timestamp, publicAppUrl, allowedOrigins, qrGenerator }) {
  const app = express();
  const origins = new Set((allowedOrigins ?? []).map((item) => item.trim()).filter(Boolean));
  app.disable('x-powered-by');
  app.use(cors({ origin: (origin, callback) => {
    if (!origin || origins.has(origin)) return callback(null, true);
    return callback(new Error('Origin tidak diizinkan.'));
  }, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Authorization', 'Content-Type'], maxAge: 600 }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/api/attendance', createAttendanceRouter({ db, auth, FieldValue: fieldValue, Timestamp: timestamp, publicAppUrl, qrGenerator }));
  app.use(attendanceErrorHandler);
  return app;
}

export function startAttendanceServer(env = process.env) {
  const envPath = resolve(env.ATTENDANCE_ENV_FILE || '.env');
  dotenv.config({ path: envPath });
  const projectId = env.FIREBASE_PROJECT_ID || env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Isi FIREBASE_PROJECT_ID di server/.env.');
  const serviceAccountPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const credential = serviceAccountPath
    ? cert(JSON.parse(readFileSync(resolve(serviceAccountPath), 'utf8')))
    : applicationDefault();
  const firebaseApp = getApps().length ? getApp() : initializeApp({ credential, projectId });
  const origins = [env.FRONTEND_URL, ...(env.CORS_ALLOWED_ORIGINS ?? '').split(',')].filter(Boolean);
  if (!origins.length) throw new Error('Isi FRONTEND_URL atau CORS_ALLOWED_ORIGINS di server/.env.');
  const app = createAttendanceApp({ db: getFirestore(firebaseApp), auth: getAuth(firebaseApp), publicAppUrl: env.PUBLIC_APP_URL || 'techlab://attendance', allowedOrigins: origins });
  const port = Number(env.PORT || 8788);
  const host = env.HOST || '0.0.0.0';
  const server = app.listen(port, host, () => console.log(`Attendance API listening on http://${host}:${port}`));
  server.on('error', (error) => { console.error('Attendance API failed to start:', error.message); process.exitCode = 1; });
  return server;
}
