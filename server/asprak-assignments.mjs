import { Router } from 'express';

function reject(status, code, message) {
  throw Object.assign(new Error(message), { status, code });
}

function documentId(value) {
  if (typeof value !== 'string' || !/^[^/]{1,128}$/.test(value) || value === '.' || value === '..') {
    reject(400, 'invalid-argument', 'ID akun atau kelas tidak valid.');
  }
  return value;
}

export async function changeAsprakAssignment({ db, FieldValue }, actorUid, { action, uid, classId }) {
  const targetUid = documentId(uid);
  const targetClassId = documentId(classId);
  if (!['approve', 'revoke'].includes(action)) reject(400, 'invalid-argument', 'Tindakan penugasan tidak valid.');
  if (actorUid === targetUid) reject(403, 'permission-denied', 'Aslab tidak dapat mengubah penugasannya sendiri.');

  const profileRef = db.doc(`users/${targetUid}`);
  const directoryRef = db.doc(`userDirectory/${targetUid}`);
  const classRef = db.doc(`classes/${targetClassId}`);
  const historyRef = db.collection('asprakAssignmentHistory').doc();

  return db.runTransaction(async (tx) => {
    const [actor, scope, profile, directory, selectedClass] = await Promise.all([
      tx.get(db.doc(`users/${actorUid}`)),
      tx.get(db.doc(`aslabScopes/${actorUid}`)),
      tx.get(profileRef), tx.get(directoryRef), tx.get(classRef),
    ]);
    const selected = selectedClass.data();
    const courses = scope.data()?.courseNames;
    if (actor.data()?.role !== 'admin' || !Array.isArray(courses)
      || !selected || selected.archivedAt != null || !courses.includes(selected.courseName)) {
      reject(403, 'permission-denied', 'Kelas berada di luar cakupan Aslab atau sudah diarsipkan.');
    }
    const current = profile.data();
    const listed = directory.data();
    if (!current || current.uid !== targetUid || !listed || listed.uid !== targetUid
      || listed.role !== current.role || listed.name !== current.name || listed.number !== current.number) {
      reject(409, 'assignment-profile-changed', 'Data akun berubah. Muat ulang daftar pengguna.');
    }
    if (action === 'approve' ? current.role !== 'calon_asprak' : current.role !== 'asisten') {
      reject(409, 'assignment-not-eligible', 'Status pengajuan atau penugasan sudah berubah.');
    }
    if (action === 'revoke' && !selected.assistantIds?.includes(targetUid)) {
      reject(409, 'assignment-not-eligible', 'Asprak sudah tidak ditugaskan pada kelas tersebut.');
    }

    const assignments = await tx.get(db.collection('classes').where('assistantIds', 'array-contains', targetUid));
    if (assignments.size > 450) {
      reject(409, 'assignment-limit', 'Terlalu banyak penugasan lama. Hubungi pengelola untuk peninjauan.');
    }
    const remaining = action === 'revoke'
      ? assignments.docs.filter((record) => record.id !== targetClassId && record.data().archivedAt == null)
      : [];
    let practitionerUid;
    if (action === 'approve') {
      if (current.practitionerUid) {
        const original = (await tx.get(db.doc(`users/${documentId(current.practitionerUid)}`))).data();
        if (original?.role !== 'praktikan' || original.uid !== current.practitionerUid) {
          reject(409, 'assignment-original-account', 'Akun Praktikan yang tertaut perlu diperiksa.');
        }
        practitionerUid = original.uid;
      } else {
        const matches = await tx.get(db.collection('users').where('number', '==', current.number));
        const practitioners = matches.docs.filter((snapshot) => {
          const data = snapshot.data();
          return data.uid === snapshot.id && data.role === 'praktikan' && data.name === current.name;
        });
        if (practitioners.length !== 1) {
          reject(409, 'assignment-original-account', 'Pastikan ada tepat satu akun Praktikan dengan nama dan NIM yang cocok.');
        }
        practitionerUid = practitioners[0].id;
      }
      if (selected.assistantIds.filter((id) => id !== targetUid).length >= 20) {
        reject(409, 'assignment-limit', 'Kelas sudah memiliki 20 Asprak.');
      }
    }

    const stamp = FieldValue.serverTimestamp();
    const remove = action === 'approve' || remaining.length === 0
      ? assignments.docs.filter((record) => action !== 'approve' || record.id !== targetClassId)
      : [selectedClass];
    for (const record of remove) {
      const data = record.data();
      const assistantIds = data.assistantIds.filter((id) => id !== targetUid);
      const memberIds = [...new Set([...assistantIds, ...data.studentIds])];
      tx.update(record.ref, { assistantIds, memberIds, updatedAt: stamp });
    }
    if (action === 'approve') {
      const assistantIds = [...new Set([...selected.assistantIds, targetUid])];
      tx.update(classRef, { assistantIds, memberIds: [...new Set([...assistantIds, ...selected.studentIds])], updatedAt: stamp });
    }

    const role = action === 'approve' || remaining.length > 0 ? 'asisten' : 'asprak_dicabut';
    const changes = { role, updatedAt: stamp, rejectionReason: FieldValue.delete() };
    // Every assignment change writes this profile, including partial revocation.
    // Concurrent changes for this UID must retry and count the latest assignments.
    tx.update(profileRef, practitionerUid ? { ...changes, practitionerUid } : changes);
    tx.update(directoryRef, changes);
    tx.create(historyRef, {
      action, uid: targetUid, actorUid, classId: targetClassId,
      removedClassIds: remove.map((record) => record.id), role, createdAt: stamp,
    });
    return { role };
  });
}

export function createAsprakAssignmentRouter({ db, auth, FieldValue }) {
  const router = Router();
  router.post('/', async (req, res, next) => {
    try {
      const match = req.get('authorization')?.match(/^Bearer\s+(\S+)$/i);
      if (!match) reject(401, 'unauthenticated', 'Silakan masuk kembali.');
      let account;
      try { account = await auth.verifyIdToken(match[1], true); }
      catch { reject(401, 'unauthenticated', 'Sesi login tidak valid. Silakan masuk kembali.'); }
      res.json(await changeAsprakAssignment({ db, FieldValue }, account.uid, req.body ?? {}));
    } catch (error) { next(error); }
  });
  return router;
}
