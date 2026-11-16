import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { parseProfile, type UserProfile } from '../auth/model';
import {
  permissionId,
  validateDecision,
  validateSubmission,
  type Classification,
  type Permission,
  type PermissionKind,
} from './model';

function parse(snapshot: DocumentSnapshot<DocumentData>): Permission {
  const data = snapshot.data()!;
  return {
    ...data,
    id: snapshot.id,
    kind: data.kind ?? 'lainnya',
    studentName: data.studentName ?? 'Praktikan',
    studentNumber: data.studentNumber ?? '',
    sessionTitle: data.sessionTitle ?? 'Sesi praktikum',
    className: data.className ?? '',
    sessionStartAt: data.sessionStartAt ?? data.createdAt,
    decisionReason: data.decisionReason ?? null,
    aiConsent: data.aiConsent ?? false,
    aiSource: data.aiSource ?? null,
    aiClassifiedAt: data.aiClassifiedAt ?? null,
    aiError: data.aiError ?? null,
  } as Permission;
}
export function createPermissionRepository(db: Firestore) {
  const permissions = collection(db, 'permissions');
  return {
    async submit(
      actor: UserProfile,
      input: { sessionId: string; reason: string; kind: PermissionKind; aiConsent: boolean },
    ) {
      const clean = validateSubmission(input.reason, input.kind);
      if (actor.role !== 'praktikan')
        throw new Error('Hanya praktikan yang dapat mengajukan izin.');
      const id = permissionId(input.sessionId, actor.uid);
      const ref = doc(permissions, id);
      await runTransaction(db, async (tx) => {
        const session = await tx.get(doc(db, 'sessions', input.sessionId));
        if (!session.exists()) throw new Error('Sesi tidak ditemukan.');
        const s = session.data();
        const [profile, classItem, member, attendance, existing, schedule] = await Promise.all([
          tx.get(doc(db, 'users', actor.uid)),
          tx.get(doc(db, 'classes', s.classId)),
          tx.get(doc(db, 'participants', `${s.classId}_${actor.uid}`)),
          tx.get(doc(db, 'attendances', id)),
          tx.get(ref),
          tx.get(doc(db, 'schedules', s.scheduleId)),
        ]);
        if (
          !profile.exists() ||
          !parseProfile(actor.uid, profile.data()).roles.includes('praktikan')
        )
          throw new Error('Identitas akun tidak valid.');
        if (
          !classItem.exists() ||
          !member.exists() ||
          member.data().leftAt !== null ||
          !s.studentIds.includes(actor.uid) ||
          !classItem.data().studentIds.includes(actor.uid)
        )
          throw new Error('Kamu bukan peserta aktif pada sesi ini.');
        if (s.status !== 'scheduled' && s.status !== 'open')
          throw new Error('Izin hanya dapat diajukan sebelum sesi ditutup atau dibatalkan.');
        if (attendance.exists()) throw new Error('Kamu sudah tercatat hadir pada sesi ini.');
        if (existing.exists())
          throw new Error('Kamu sudah mengajukan izin pada sesi ini. Buka status izin yang ada.');
        if (
          !schedule.exists() ||
          schedule.data().classId !== s.classId ||
          schedule.data().archivedAt ||
          classItem.data().archivedAt
        )
          throw new Error('Kelas atau jadwal tidak lagi tersedia.');
        tx.set(ref, {
          sessionId: session.id,
          classId: s.classId,
          userId: actor.uid,
          ...clean,
          studentName: profile.data().name,
          studentNumber: profile.data().number,
          sessionTitle: schedule.data().title,
          className: classItem.data().className,
          sessionStartAt: s.startAt,
          status: 'pending',
          decidedBy: null,
          decidedAt: null,
          decisionReason: null,
          aiConsent: input.aiConsent,
          aiStatus: 'unavailable',
          aiCategory: null,
          aiConfidence: null,
          aiSource: null,
          aiClassifiedAt: null,
          aiError:
            input.aiConsent
              ? 'Analisis AI belum selesai. Kamu dapat mencoba lagi dari detail pengajuan.'
              : 'Pemohon tidak memilih analisis AI. Asisten dapat meninjau pengajuan secara manual.',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      return id;
    },
    subscribeOwnAttendance(
      sessionId: string,
      userId: string,
      next: (present: boolean, cached: boolean) => void,
      fail: (error: Error) => void,
    ) {
      return onSnapshot(
        doc(db, 'attendances', permissionId(sessionId, userId)),
        { includeMetadataChanges: true },
        (snapshot) => next(snapshot.exists(), snapshot.metadata.fromCache),
        fail,
      );
    },
    async decide(id: string, actor: UserProfile, status: 'approved' | 'rejected', reason: string) {
      const clean = validateDecision(status, reason);
      if (actor.role !== 'asisten') throw new Error('Hanya asisten yang dapat memutuskan izin.');
      await runTransaction(db, async (tx) => {
        const ref = doc(permissions, id);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) throw new Error('Pengajuan tidak ditemukan.');
        const p = snapshot.data();
        const classItem = await tx.get(doc(db, 'classes', p.classId));
        if (!classItem.exists() || !classItem.data().assistantIds.includes(actor.uid))
          throw new Error('Pengajuan ini bukan kewenanganmu.');
        if (p.status !== 'pending')
          throw new Error(
            'Pengajuan sudah diputuskan oleh asisten. Muat ulang untuk melihat keputusan terbaru.',
          );
        tx.update(ref, {
          ...clean,
          decidedBy: actor.uid,
          decidedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    },
    async beginClassification(id: string, actor: UserProfile) {
      return runTransaction(db, async (tx) => {
        const ref = doc(permissions, id);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) throw new Error('Pengajuan tidak ditemukan.');
        const p = snapshot.data();
        if (actor.role !== 'praktikan' || p.userId !== actor.uid || !p.aiConsent || p.status !== 'pending')
          throw new Error('Analisis AI tidak dapat dimulai untuk pengajuan ini.');
        if (p.aiStatus === 'completed' || (p.aiStatus === 'processing' &&
            Date.now() - (p.aiClassifiedAt?.toMillis() ?? 0) < 60000)) return false;
        tx.update(ref, {
          aiStatus: 'processing', aiCategory: null, aiConfidence: null, aiSource: null,
          aiError: 'Analisis AI sedang berjalan. Keputusan tetap dibuat oleh asisten.',
          aiClassifiedAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        return true;
      });
    },
    // Only AI metadata changes, even if an assistant decides while a request is in flight.
    async saveClassification(id: string, actor: UserProfile, classification: Classification) {
      await runTransaction(db, async (tx) => {
        const ref = doc(permissions, id);
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) throw new Error('Pengajuan tidak ditemukan.');
        const p = snapshot.data();
        if (
          actor.role !== 'praktikan' ||
          p.userId !== actor.uid ||
          !p.aiConsent ||
          (p.status !== 'pending' && p.aiStatus !== 'processing')
        )
          throw new Error('Klasifikasi tidak dapat diubah untuk pengajuan ini.');
        tx.update(ref, {
          ...classification,
          aiClassifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    },
    subscribeOne(
      id: string,
      next: (item: Permission | null, cached: boolean) => void,
      fail: (error: Error) => void,
    ) {
      return onSnapshot(
        doc(permissions, id),
        { includeMetadataChanges: true },
        (snapshot) => next(snapshot.exists() ? parse(snapshot) : null, snapshot.metadata.fromCache),
        fail,
      );
    },
    subscribeList(
      actor: UserProfile,
      next: (items: Permission[], cached: boolean) => void,
      fail: (error: Error) => void,
    ) {
      const ordered = (items: Permission[]) =>
        items.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      if (actor.role === 'praktikan')
        return onSnapshot(
          query(permissions, where('userId', '==', actor.uid)),
          { includeMetadataChanges: true },
          (snapshot) => next(ordered(snapshot.docs.map(parse)), snapshot.metadata.fromCache),
          fail,
        );
      let stops: (() => void)[] = [];
      let failed = false;
      let generation = 0;
      let disposed = false;
      let key: string | null = null;
      const cache = new Map<string, { items: Permission[]; cached: boolean }>();
      let classesCached = true;
      const onError = (error: Error) => {
        if (disposed) return;
        failed = true;
        fail(error);
      };
      const stopClasses = onSnapshot(
        query(collection(db, 'classes'), where('memberIds', 'array-contains', actor.uid)),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (disposed) return;
          classesCached = snapshot.metadata.fromCache;
          const ids = snapshot.docs
            .filter((item) => item.data().assistantIds.includes(actor.uid))
            .map((item) => item.id)
            .sort();
          const nextKey = ids.join('|');
          if (key !== nextKey) {
            const version = ++generation;
            stops.forEach((stop) => stop());
            stops = [];
            cache.clear();
            key = nextKey;
            ids.forEach((classId) => {
              stops.push(
                onSnapshot(
                  query(permissions, where('classId', '==', classId)),
                  { includeMetadataChanges: true },
                  (list) => {
                    if (disposed || generation !== version) return;
                    cache.set(classId, {
                      items: list.docs.map(parse),
                      cached: list.metadata.fromCache,
                    });
                    if (!failed && cache.size === ids.length)
                      next(
                        ordered([...cache.values()].flatMap((item) => item.items)),
                        classesCached || [...cache.values()].some((item) => item.cached),
                      );
                  },
                  (error) => {
                    if (generation === version) onError(error);
                  },
                ),
              );
            });
          }
          if (!failed && cache.size === ids.length)
            next(
              ordered([...cache.values()].flatMap((item) => item.items)),
              classesCached || [...cache.values()].some((item) => item.cached),
            );
        },
        onError,
      );
      return () => {
        disposed = true;
        generation++;
        stopClasses();
        stops.forEach((stop) => stop());
      };
    },
  };
}
export type PermissionRepository = ReturnType<typeof createPermissionRepository>;
