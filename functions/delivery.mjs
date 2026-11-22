import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';

const key = (value) => createHash('sha256').update(value).digest('hex');
export async function enqueue(db, eventId, event) {
  if (!event) return;
  for (const uid of event.recipients) {
    const profile = await db.doc(`users/${uid}`).get();
    if (!['praktikan', 'asisten', 'admin'].includes(profile.data()?.role)) continue;
    if (event.type === 'session-opened' && profile.data().role !== 'praktikan') continue;
    const tokens = await db.collection('userPushTokens').where('uid', '==', uid).get();
    const id = key(`${eventId}:${uid}`);
    const inbox = db.doc(`users/${uid}/notifications/${id}`);
    await db.runTransaction(async (tx) => {
      if ((await tx.get(inbox)).exists) return;
      tx.create(inbox, {
        title: event.title,
        body: event.body.slice(0, 2000),
        path: event.path,
        type: event.type,
        createdAt: FieldValue.serverTimestamp(),
        delivery: tokens.empty ? 'no-device' : 'queued',
      });
      for (const token of tokens.docs) {
        tx.create(db.doc(`notificationDeliveries/${key(`${id}:${token.id}`)}`), {
          uid,
          inboxPath: inbox.path,
          token: token.id,
          title: event.title,
          body: event.body.slice(0, 2000),
          path: event.path,
          state: 'queued',
          attempts: 0,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });
  }
}

export async function sendPush(payload, fetcher = fetch) {
  const response = await fetcher('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      to: payload.token,
      title: payload.title,
      body: [...String(payload.body ?? '')].slice(0, 500).join(''),
      sound: 'default',
      channelId: 'practicum',
      data: { path: payload.path, ownerId: payload.uid },
    }),
  });
  if (!response.ok) throw new Error('push-unavailable');
  const { data } = await response.json();
  if (!data || !['ok', 'error'].includes(data.status)) throw new Error('push-invalid-response');
  if (data.status === 'ok' && typeof data.id !== 'string') throw new Error('push-invalid-ticket');
  return data;
}

export async function deliver(db, ref, sender = sendPush) {
  const job = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().state !== 'queued') return null;
    tx.update(ref, {
      state: 'sending',
      attempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return snap.data();
  });
  if (!job) return;
  try {
    // Recheck token ownership immediately before send (logout/account switch).
    const device = await db.doc(`userPushTokens/${job.token}`).get();
    if (device.data()?.uid !== job.uid) {
      await ref.update({ state: 'inactive' });
      await db.doc(job.inboxPath).update({ delivery: 'inactive' });
      return;
    }
    const result = await sender(job);
    await ref.update({
      state: result.status === 'ok' ? 'accepted' : 'failed',
      receiptId: result.id ?? null,
      error: result.status === 'error' ? 'push-rejected' : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db
      .doc(job.inboxPath)
      .update({ delivery: result.status === 'ok' ? 'accepted' : 'failed' });
    if (result.details?.error === 'DeviceNotRegistered') {
      const ref = db.doc(`userPushTokens/${job.token}`);
      await db.runTransaction(async (tx) => {
        if ((await tx.get(ref)).data()?.uid === job.uid) tx.delete(ref);
      });
    }
  } catch {
    await ref.update({
      state: 'failed',
      error: 'push-unavailable',
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db.doc(job.inboxPath).update({ delivery: 'failed' });
  }
}

// Expo tickets mean accepted by the service, not delivered to the phone.
// Receipt checks run separately so a transport failure never changes source data.
export async function checkReceipts(db, fetcher = fetch) {
  const jobs = await db
    .collection('notificationDeliveries')
    .where('state', '==', 'accepted')
    .limit(200)
    .get();
  const due = jobs.docs.filter(
    (doc) =>
      doc.data().receiptId &&
      Date.now() - (doc.data().updatedAt?.toMillis() ?? 0) >= 15 * 60 * 1000,
  );
  if (!due.length) return;
  const response = await fetcher('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST',
    signal: AbortSignal.timeout(15000),
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.EXPO_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({ ids: due.map((doc) => doc.data().receiptId) }),
  });
  if (!response.ok) throw new Error('receipt-unavailable');
  const result = await response.json();
  for (const job of due) {
    const data = job.data();
    const receipt = result.data?.[data.receiptId];
    const expired = Date.now() - data.updatedAt.toMillis() > 24 * 60 * 60 * 1000;
    if (!receipt && !expired) continue;
    const state = receipt?.status === 'ok' ? 'confirmed' : 'failed';
    await job.ref.update({ state, error: state === 'failed' ? 'delivery-unconfirmed' : null });
    await db.doc(data.inboxPath).update({ delivery: state });
    if (receipt?.details?.error === 'DeviceNotRegistered') {
      const ref = db.doc(`userPushTokens/${data.token}`);
      await db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (current.data()?.uid === data.uid) tx.delete(ref);
      });
    }
  }
}
export async function maintainDeliveries(db) {
  const jobs = await db
    .collection('notificationDeliveries')
    .where('state', '==', 'queued')
    .limit(100)
    .get();
  for (const job of jobs.docs) await deliver(db, job.ref);
  const stale = await db
    .collection('notificationDeliveries')
    .where('state', '==', 'sending')
    .limit(100)
    .get();
  for (const job of stale.docs) {
    const data = job.data();
    if (Date.now() - (data.updatedAt?.toMillis() ?? 0) < 5 * 60 * 1000) continue;
    // An interrupted request may already have reached Expo. Avoid blind duplicate sends.
    await job.ref.update({ state: 'failed', error: 'delivery-unconfirmed' });
    await db.doc(data.inboxPath).update({ delivery: 'failed' });
  }
}
