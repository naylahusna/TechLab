import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { sessionOpened, scheduleChanged, sessionCancelled, permissionDecided } from './events.mjs';
import { enqueue, deliver, checkReceipts, maintainDeliveries } from './delivery.mjs';
import { createAttendanceQrHandlers } from './attendance-qr.mjs';
import { onCall } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();
const options = { region: 'asia-southeast2', retry: true };
const attendanceQr = createAttendanceQrHandlers(db);
export const createAttendanceQr = onCall({ region: options.region }, attendanceQr.create);
export const disableAttendanceQr = onCall({ region: options.region }, attendanceQr.disable);
export const recordQrAttendance = onCall({ region: options.region }, attendanceQr.attend);
export const notifySessionOpened = onDocumentUpdated(
  { ...options, document: 'sessions/{id}' },
  async (event) => {
    const before = event.data.before.data(),
      after = event.data.after.data();
    const [classDoc, schedule] = await Promise.all([
      db.doc(`classes/${after.classId}`).get(),
      db.doc(`schedules/${after.scheduleId}`).get(),
    ]);
    if (!classDoc.exists || !schedule.exists || schedule.data().archivedAt) return;
    await enqueue(
      db,
      event.id,
      sessionOpened(before, after, classDoc.data(), schedule.data(), event.params.id),
    );
    await enqueue(
      db,
      `${event.id}:cancelled`,
      sessionCancelled(before, after, classDoc.data(), schedule.data(), event.params.id),
    );
  },
);
export const notifyScheduleChanged = onDocumentUpdated(
  { ...options, document: 'schedules/{id}' },
  async (event) => {
    const before = event.data.before.data(),
      after = event.data.after.data();
    const klass = await db.doc(`classes/${after.classId}`).get();
    if (klass.exists)
      await enqueue(db, event.id, scheduleChanged(before, after, klass.data(), event.params.id));
  },
);
export const dispatchPush = onDocumentCreated(
  { ...options, document: 'notificationDeliveries/{id}' },
  async (event) => deliver(db, event.data.ref),
);
export const notifyPermissionDecided = onDocumentUpdated(
  { ...options, document: 'permissions/{id}' },
  async (event) =>
    enqueue(
      db,
      event.id,
      permissionDecided(event.data.before.data(), event.data.after.data(), event.params.id),
    ),
);
export const monitorPushDelivery = onSchedule(
  { region: options.region, schedule: 'every 15 minutes' },
  async () => {
    await maintainDeliveries(db);
    await checkReceipts(db);
  },
);
