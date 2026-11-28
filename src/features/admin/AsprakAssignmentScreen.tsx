import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AppPage } from '../../components/AppPage';
import { ActionButton } from '../../components/ActionButton';
import { Text } from '../../components/Text';
import { FormField } from '../auth/AuthForm';
import { CsvImport } from '../imports/CsvImport';
import { usePracticumClass } from '../practicum/hooks';
import { asprakCsvHeaders, parseAsprakRow } from './asprak-csv';
import { assignActiveAsprak, resolveActiveAsprakByNumber } from './users';

export function AsprakAssignmentScreen({ classId }: { classId: string }) {
  const router = useRouter();
  const { item, status, error } = usePracticumClass(classId);
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; ok: boolean }>();

  async function assignByNumber(nim: string): Promise<string> {
    const user = await resolveActiveAsprakByNumber(nim);
    await assignActiveAsprak(user.uid, classId);
    return user.name + ' ditugaskan ke kelas ini.';
  }

  async function assignOne() {
    if (busy || importBusy) return;
    setBusy(true);
    setFeedback(undefined);
    try {
      setFeedback({ ok: true, message: await assignByNumber(parseAsprakRow({ nim_asprak: number })) });
      setNumber('');
    } catch (cause) {
      setFeedback({ ok: false, message: cause instanceof Error ? cause.message : 'Penugasan gagal disimpan.' });
    } finally { setBusy(false); }
  }

  return (
    <AppPage title="Kelola Asprak" subtitle={item ? item.courseName + ' · ' + item.className : 'Penugasan kelas'}
      onBack={() => router.dismissTo(`/kelas/${classId}`)}>
      {status === 'loading' && <Text>Memuat kelas…</Text>}
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      {item && !item.labId && <Text>Tetapkan lab roster dari layar Kelola peserta terlebih dahulu.</Text>}
      {item?.labId && !item.archivedAt && <>
        <FormField label="NIM Asprak" value={number} onChangeText={setNumber} editable={!busy && !importBusy} />
        <ActionButton title="Tugaskan Asprak" disabled={busy || importBusy || !number.trim()} onPress={() => void assignOne()} />
        {feedback && <Text accessibilityRole={feedback.ok ? undefined : 'alert'}>{feedback.message}</Text>}
        <Text>{item.assistantIds.length} Asprak ditugaskan</Text>
        <CsvImport title="Unggah Asprak" filename="template-asprak-techlab.csv"
          headers={asprakCsvHeaders} validate={parseAsprakRow} identity={(value) => value}
          onBusyChange={setImportBusy} check={async (nim) => (await resolveActiveAsprakByNumber(nim)).name}
          save={async (nim) => {
            if (busy) throw new Error('Tunggu penugasan satuan selesai.');
            return assignByNumber(nim);
          }} />
      </>}
    </AppPage>
  );
}
