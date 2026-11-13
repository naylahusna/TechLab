import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '../auth/AuthProvider';
import { getPracticumRepository } from './client';
import { practicumErrorMessage } from './errors';
import type { PracticumClass } from './types';

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

  return { ...state, reload: load };
}
