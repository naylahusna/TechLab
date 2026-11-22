import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import { getPracticumRepository } from '../practicum/client';
import { practicumErrorMessage } from '../practicum/errors';
import type { LabActivityData } from './lab-activity';

type ActivityState = { data: LabActivityData | null; error: string | null; loading: boolean };

export function useLabActivity() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const canAssist = profile?.role === 'asisten' || profile?.role === 'admin';
  const [state, setState] = useState<ActivityState>({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!uid) return;
    let active = true;
    setState({ data: null, error: null, loading: true });

    async function load(memberId: string) {
      try {
        const repository = getPracticumRepository();
        const classes = (await (canAssist
          ? repository.listClassesForAssistant(memberId)
          : repository.listClassesForPractitioner(memberId))).filter((item) => !item.archivedAt);
        if (!active) return;
        const results = await Promise.all(classes.map((item) => Promise.all([
          repository.listSchedules(item.id), repository.listSessions(item.id),
        ])));
        if (active) setState({
          data: { classes, schedules: results.flatMap(([items]) => items), sessions: results.flatMap(([, items]) => items) },
          error: null,
          loading: false,
        });
      } catch (error) {
        if (active) setState({ data: null, error: practicumErrorMessage(error), loading: false });
      }
    }

    void load(uid);
    return () => { active = false; };
    // A retry starts a new load and invalidates the previous request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, canAssist, attempt]));

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
