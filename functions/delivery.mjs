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
        title: event.title, body: event.body.slice(0, 2000), path: event.path,
        type: event.type, createdAt: FieldValue.serverTimestamp(),
        delivery: tokens.empty ? 'no-device' : 'queued',
      });
      for (const token of tokens.docs) {
        tx.create(db.doc(`notificationDeliveries/${key(`${id}:${token.id}`)}`), {
          uid, inboxPath: inbox.path, token: token.id, title: event.title,
          body: event.body.slice(0, 2000), path: event.path,
          state: 'queued', attempts: 0, createdAt: FieldValue.serverTimestamp(),
        });
      }
    });
  }
}

export async function sendPush(payload, fetcher = fetch) {
  const response = await fetcher('https://exp.host/--/api/v2/push/send', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...(process.env.EXPO_ACCESS_TOKEN
      ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}) },
    body: JSON.stringify({ to: payload.token, title: payload.title,
      body: payload.body, sound: 'default', channelId: 'practicum',
      data: { path: payload.path, ownerId: payload.uid } }),
  });
  if (!response.ok) throw new Error('push-unavailable');
  const { data } = await response.json();
  if (!data || !['ok', 'error'].includes(data.status)) throw new Error('push-invalid-response');
  return data;
}

export async function deliver(db, ref) {
  const job = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().state !== 'queued') return null;
    tx.update(ref, { state: 'sending', attempts: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
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
    const result = await sendPush(job);
    await ref.update({ state: result.status === 'ok' ? 'accepted' : 'failed',
      receiptId: result.id ?? null, error: result.status === 'error' ? 'push-rejected' : null,
      updatedAt: FieldValue.serverTimestamp() });
    await db.doc(job.inboxPath).update({ delivery: result.status === 'ok' ? 'accepted' : 'failed' });
    if (result.details?.error === 'DeviceNotRegistered') await db.doc(`userPushTokens/${job.token}`).delete();
  } catch {
    await ref.update({ state: 'failed', error: 'push-unavailable', updatedAt: FieldValue.serverTimestamp() });
    await db.doc(job.inboxPath).update({ delivery: 'failed' });
  }
}
