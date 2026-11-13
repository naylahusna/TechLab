import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '../auth/AuthProvider';
import type { SessionWithSummary } from '../assistant/types';
import type { RiwayatItem } from '../practitioner/types';
import { getPracticumRepository } from './client';
import { practicumErrorMessage } from './errors';
import { toAssistantRecapItems, toPractitionerHistoryItems } from './session-view';
import type {
  PracticumAttendance,
  PracticumClass,
  PracticumParticipant,
  PracticumPermission,
  PracticumSchedule,
  PracticumSession,
} from './types';

type ClassesState = {
  status: 'loading' | 'ready' | 'error';
  classes: PracticumClass[];
  error: string | null;
  refreshing: boolean;
};

type ClassState = {
  status: 'loading' | 'ready' | 'missing' | 'error';
  item: PracticumClass | null;
  error: string | null;
};

export function useAssistantClasses() {
  const auth = useAuth();
  const assistantId = auth.profile?.uid;
  const [state, setState] = useState<ClassesState>({
    status: 'loading',
    classes: [],
    error: null,
    refreshing: false,
  });

  const load = useCallback(async () => {
    if (!assistantId) {
      setState({ status: 'ready', classes: [], error: null, refreshing: false });
      return;
    }
    setState((previous) => ({
      ...previous,
      status: previous.classes.length > 0 ? 'ready' : 'loading',
      error: null,
      refreshing: previous.classes.length > 0,
    }));
    try {
      const classes = await getPracticumRepository().listClassesForAssistant(assistantId);
      setState({ status: 'ready', classes, error: null, refreshing: false });
    } catch (error) {
      setState({
        status: 'error',
        classes: [],
        error: practicumErrorMessage(error),
        refreshing: false,
      });
    }
  }, [assistantId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!assistantId) return;
    return getPracticumRepository().subscribeToClassesForAssistant(assistantId, () => {
      void load();
    });
  }, [assistantId, load]);

  return { ...state, reload: load };
}

type ListState<T> = {
  status: 'loading' | 'ready' | 'missing' | 'error';
  items: T[];
  error: string | null;
  refreshing: boolean;
};

function useListResource<T>(
  id: string | undefined,
  loader: (id: string) => Promise<T[]>,
  subscribe?: (id: string, onChange: () => void) => () => void,
) {
  const [state, setState] = useState<ListState<T>>({
    status: 'loading',
    items: [],
    error: null,
    refreshing: false,
  });

  const load = useCallback(async () => {
    if (!id) {
      setState({ status: 'missing', items: [], error: null, refreshing: false });
      return;
    }
    setState((previous) => ({
      ...previous,
      status: previous.items.length > 0 ? 'ready' : 'loading',
      error: null,
      refreshing: previous.items.length > 0,
    }));
    try {
      const items = await loader(id);
      setState({ status: 'ready', items, error: null, refreshing: false });
    } catch (error) {
      setState({
        status: 'error',
        items: [],
        error: practicumErrorMessage(error),
        refreshing: false,
      });
    }
  }, [id, loader]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!id || !subscribe) return;
    return subscribe(id, () => {
      void load();
    });
  }, [id, subscribe, load]);

  return { ...state, reload: load };
}

export function useSchedules(classId: string | undefined) {
  const loader = useCallback(
    (id: string) => getPracticumRepository().listSchedules(id),
    [],
  );
  const subscribe = useCallback(
    (id: string, onChange: () => void) =>
      getPracticumRepository().subscribeToSchedules(id, onChange),
    [],
  );
  return useListResource(classId, loader, subscribe);
}

export function useSessions(classId: string | undefined) {
  const loader = useCallback(
    (id: string) => getPracticumRepository().listSessions(id),
    [],
  );
  const subscribe = useCallback(
    (id: string, onChange: () => void) =>
      getPracticumRepository().subscribeToSessions(id, onChange),
    [],
  );
  return useListResource(classId, loader, subscribe);
}

export function useParticipants(classId: string | undefined) {
  const loader = useCallback(
    (id: string) => getPracticumRepository().listParticipants(id),
    [],
  );
  const subscribe = useCallback(
    (id: string, onChange: () => void) =>
      getPracticumRepository().subscribeToParticipants(id, onChange),
    [],
  );
  return useListResource(classId, loader, subscribe);
}

export function useRecap(sessionId: string | undefined) {
  const loader = useCallback(
    (id: string) => getPracticumRepository().listRecap(id),
    [],
  );
  const subscribe = useCallback(
    (id: string, onChange: () => void) =>
      getPracticumRepository().subscribeToRecap(id, onChange),
    [],
  );
  return useListResource(sessionId, loader, subscribe);
}

type ScheduleOverviewState = {
  status: 'loading' | 'ready' | 'error';
  classes: PracticumClass[];
  schedules: PracticumSchedule[];
  sessions: PracticumSession[];
  error: string | null;
  refreshing: boolean;
};

export function useScheduleOverview() {
  const auth = useAuth();
  const userId = auth.profile?.uid;
  const role = auth.profile?.role;
  const [state, setState] = useState<ScheduleOverviewState>({
    status: 'loading',
    classes: [],
    schedules: [],
    sessions: [],
    error: null,
    refreshing: false,
  });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!userId || !role) {
      requestId.current += 1;
      setState({
        status: 'ready',
        classes: [],
        schedules: [],
        sessions: [],
        error: null,
        refreshing: false,
      });
      return;
    }
    const request = requestId.current + 1;
    requestId.current = request;
    setState((previous) => ({
      ...previous,
      status: previous.sessions.length > 0 ? 'ready' : 'loading',
      error: null,
      refreshing: previous.sessions.length > 0,
    }));
    try {
      const repository = getPracticumRepository();
      const [classes, schedules, sessions] =
        role === 'asisten'
          ? await Promise.all([
              repository.listClassesForAssistant(userId),
              repository.listSchedulesForAssistant(userId),
              repository.listSessionsForAssistant(userId),
            ])
          : await Promise.all([
              repository.listClassesForPractitioner(userId),
              repository.listSchedulesForPractitioner(userId),
              repository.listSessionsForPractitioner(userId),
            ]);
      if (request !== requestId.current) return;
      setState({
        status: 'ready',
        classes,
        schedules,
        sessions,
        error: null,
        refreshing: false,
      });
    } catch (error) {
      if (request !== requestId.current) return;
      setState({
        status: 'error',
        classes: [],
        schedules: [],
        sessions: [],
        error: practicumErrorMessage(error),
        refreshing: false,
      });
    }
  }, [userId, role]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!userId) return;
    return getPracticumRepository().subscribeToScheduleOverview(userId, () => {
      void load();
    });
  }, [userId, load]);

  return { ...state, reload: load };
}

type RecapOverviewState = {
  status: 'loading' | 'ready' | 'error';
  items: SessionWithSummary[];
  error: string | null;
  refreshing: boolean;
};

export function useAssistantRecapOverview() {
  const auth = useAuth();
  const assistantId = auth.profile?.role === 'asisten' ? auth.profile.uid : undefined;
  const [state, setState] = useState<RecapOverviewState>({
    status: 'loading',
    items: [],
    error: null,
    refreshing: false,
  });

  const load = useCallback(async () => {
    if (!assistantId) {
      setState({ status: 'ready', items: [], error: null, refreshing: false });
      return;
    }
    setState((previous) => ({
      ...previous,
      status: previous.items.length > 0 ? 'ready' : 'loading',
      error: null,
      refreshing: previous.items.length > 0,
    }));
    try {
      const repository = getPracticumRepository();
      const [classes, schedules, sessions] = await Promise.all([
        repository.listClassesForAssistant(assistantId),
        repository.listSchedulesForAssistant(assistantId),
        repository.listSessionsForAssistant(assistantId),
      ]);
      const attendanceBySession: Record<string, PracticumAttendance[]> = {};
      await Promise.all(
        sessions
          .filter((session) => session.status !== 'scheduled')
          .map(async (session) => {
            attendanceBySession[session.id] = await repository.listAttendance(session.id);
          }),
      );
      setState({
        status: 'ready',
        items: toAssistantRecapItems(classes, schedules, sessions, attendanceBySession),
        error: null,
        refreshing: false,
      });
    } catch (error) {
      setState({
        status: 'error',
        items: [],
        error: practicumErrorMessage(error),
        refreshing: false,
      });
    }
  }, [assistantId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { ...state, reload: load };
}

type PractitionerHistoryState = {
  status: 'loading' | 'ready' | 'error';
  items: RiwayatItem[];
  error: string | null;
  refreshing: boolean;
};

export function usePractitionerHistory() {
  const auth = useAuth();
  const userId = auth.profile?.role === 'praktikan' ? auth.profile.uid : undefined;
  const [state, setState] = useState<PractitionerHistoryState>({
    status: 'loading',
    items: [],
    error: null,
    refreshing: false,
  });

  const load = useCallback(async () => {
    if (!userId) {
      setState({ status: 'ready', items: [], error: null, refreshing: false });
      return;
    }
    setState((previous) => ({
      ...previous,
      status: previous.items.length > 0 ? 'ready' : 'loading',
      error: null,
      refreshing: previous.items.length > 0,
    }));
    try {
      const repository = getPracticumRepository();
      const [classes, schedules, sessions] = await Promise.all([
        repository.listClassesForPractitioner(userId),
        repository.listSchedulesForPractitioner(userId),
        repository.listSessionsForPractitioner(userId),
      ]);
      const attendanceBySession: Record<string, PracticumAttendance[]> = {};
      await Promise.all(
        sessions
          .filter(
            (session) =>
              session.studentIds.includes(userId) && session.status !== 'scheduled',
          )
          .map(async (session) => {
            const record = await repository.getAttendance(session.id, userId);
            attendanceBySession[session.id] = record ? [record] : [];
          }),
      );
      setState({
        status: 'ready',
        items: toPractitionerHistoryItems(
          classes,
          schedules,
          sessions,
          attendanceBySession,
          userId,
        ),
        error: null,
        refreshing: false,
      });
    } catch (error) {
      setState({
        status: 'error',
        items: [],
        error: practicumErrorMessage(error),
        refreshing: false,
      });
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { ...state, reload: load };
}

type SessionDetailState = {
  status: 'loading' | 'ready' | 'missing' | 'error';
  session: PracticumSession | null;
  classItem: PracticumClass | null;
  schedule: PracticumSchedule | null;
  participants: PracticumParticipant[];
  attendance: PracticumAttendance[];
  permissions: PracticumPermission[];
  error: string | null;
  refreshing: boolean;
};

export function useSessionDetail(sessionId: string | undefined) {
  const auth = useAuth();
  const userId = auth.profile?.uid;
  const role = auth.profile?.role;
  const [state, setState] = useState<SessionDetailState>({
    status: 'loading',
    session: null,
    classItem: null,
    schedule: null,
    participants: [],
    attendance: [],
    permissions: [],
    error: null,
    refreshing: false,
  });

  const load = useCallback(async () => {
    if (!sessionId || !userId || !role) {
      setState({
        status: 'missing',
        session: null,
        classItem: null,
        schedule: null,
        participants: [],
        attendance: [],
        permissions: [],
        error: null,
        refreshing: false,
      });
      return;
    }
    setState((previous) => ({
      ...previous,
      status: previous.session ? previous.status : 'loading',
      error: null,
      refreshing: previous.session !== null,
    }));
    try {
      const repository = getPracticumRepository();
      const session = await repository.getSession(sessionId);
      if (!session) {
        setState({
          status: 'missing',
          session: null,
          classItem: null,
          schedule: null,
          participants: [],
          attendance: [],
          permissions: [],
          error: null,
          refreshing: false,
        });
        return;
      }
      const [classItem, schedule] = await Promise.all([
        repository.getClass(session.classId),
        repository.getSchedule(session.scheduleId),
      ]);
      if (!classItem) {
        setState((previous) => ({
          ...previous,
          status: 'error',
          error: 'Kelas tidak ditemukan.',
          refreshing: false,
        }));
        return;
      }
      let participants: PracticumParticipant[] = [];
      let attendance: PracticumAttendance[] = [];
      let permissions: PracticumPermission[] = [];
      if (role === 'asisten') {
        [participants, attendance, permissions] = await Promise.all([
          repository.listParticipantsByIds(session.classId, session.studentIds),
          repository.listAttendance(sessionId),
          repository.listPermissions(sessionId, session.classId),
        ]);
      } else {
        const own = await repository.getAttendance(sessionId, userId);
        attendance = own ? [own] : [];
      }
      setState({
        status: 'ready',
        session,
        classItem,
        schedule,
        participants,
        attendance,
        permissions,
        error: null,
        refreshing: false,
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        status: 'error',
        error: practicumErrorMessage(error),
        refreshing: false,
      }));
    }
  }, [sessionId, userId, role]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!sessionId || !userId || !role) return;
    const repository = getPracticumRepository();
    if (role === 'asisten') {
      return repository.subscribeToRecap(sessionId, () => {
        void load();
      });
    }
    const stopSession = repository.subscribeToSession(sessionId, () => {
      void load();
    });
    const stopAttendance = repository.subscribeToOwnAttendance(
      sessionId,
      userId,
      () => {
        void load();
      },
    );
    return () => {
      stopSession();
      stopAttendance();
    };
  }, [sessionId, userId, role, load]);

  return { ...state, reload: load };
}

export function usePracticumClass(classId: string | undefined) {
  const [state, setState] = useState<ClassState>({
    status: 'loading',
    item: null,
    error: null,
  });

  const load = useCallback(async () => {
    if (!classId) {
      setState({ status: 'missing', item: null, error: null });
      return;
    }
    setState((previous) => ({
      ...previous,
      status: previous.item ? previous.status : 'loading',
      error: null,
    }));
    try {
      const item = await getPracticumRepository().getClass(classId);
      setState({
        status: item ? 'ready' : 'missing',
        item,
        error: null,
      });
    } catch (error) {
      setState({
        status: 'error',
        item: null,
        error: practicumErrorMessage(error),
      });
    }
  }, [classId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!classId) return;
    return getPracticumRepository().subscribeToClass(classId, () => {
      void load();
    });
  }, [classId, load]);

  return { ...state, reload: load };
}
