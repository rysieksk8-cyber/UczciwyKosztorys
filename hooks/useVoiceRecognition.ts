import { useCallback, useEffect, useRef, useState } from 'react';
import type { Audio } from 'expo-av';
import { voiceLimits } from '@/constants/voice';
import { deleteVoiceFile, discardVoiceRecording, finishVoiceRecording, startVoiceRecording, transcribePolishRecording } from '@/services/speechRecognition';

type VoicePhase = 'idle' | 'starting' | 'recording' | 'stopping' | 'transcribing';
interface VoiceOptions { onRecognized: (text: string) => void }

export function useVoiceRecognition({ onRecognized }: VoiceOptions) {
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [hasPendingRecording, setHasPendingRecording] = useState(false);
  const [recognized, setRecognized] = useState(false);
  const recorder = useRef<Audio.Recording | null>(null);
  const pendingUri = useRef('');
  const alive = useRef(true);
  const locked = useRef(false);
  const callback = useRef(onRecognized);
  callback.current = onRecognized;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current) {
        void discardVoiceRecording(recorder.current);
        recorder.current = null;
      }
      if (pendingUri.current) {
        void deleteVoiceFile(pendingUri.current);
        pendingUri.current = '';
      }
    };
  }, []);

  const recognize = useCallback(async (uri: string) => {
    if (alive.current) setPhase('transcribing');
    try {
      const text = await transcribePolishRecording(uri);
      if (!alive.current) return;
      callback.current(text);
      setRecognized(true);
      setHasPendingRecording(false);
      pendingUri.current = '';
      await deleteVoiceFile(uri);
    } catch (reason) {
      if (alive.current) {
        setVoiceError(reason instanceof Error ? reason.message : 'Nie udało się rozpoznać mowy. Spróbuj ponownie lub wpisz opis.');
        setHasPendingRecording(true);
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (locked.current || !recorder.current) return;
    locked.current = true;
    const current = recorder.current;
    recorder.current = null;
    current.setOnRecordingStatusUpdate(null);
    if (alive.current) { setPhase('stopping'); setVoiceError(''); }
    try {
      const uri = await finishVoiceRecording(current);
      if (!alive.current) { await deleteVoiceFile(uri); return; }
      pendingUri.current = uri;
      setHasPendingRecording(true);
      await recognize(uri);
    } catch (reason) {
      await discardVoiceRecording(current);
      if (alive.current) setVoiceError(reason instanceof Error ? reason.message : 'Nie udało się zapisać nagrania. Spróbuj ponownie.');
    } finally {
      locked.current = false;
      if (alive.current) setPhase('idle');
    }
  }, [recognize]);

  const toggleRecording = useCallback(async () => {
    if (locked.current) return;
    if (recorder.current) { await stopRecording(); return; }
    locked.current = true;
    setPhase('starting'); setVoiceError(''); setRecognized(false); setSeconds(0);
    try {
      const current = await startVoiceRecording();
      if (!alive.current) { await discardVoiceRecording(current); return; }
      if (pendingUri.current) await deleteVoiceFile(pendingUri.current);
      pendingUri.current = '';
      setHasPendingRecording(false);
      if (!alive.current) { await discardVoiceRecording(current); return; }
      recorder.current = current;
      current.setProgressUpdateInterval(250);
      current.setOnRecordingStatusUpdate(status => {
        if (!alive.current) return;
        setSeconds(Math.min(voiceLimits.maxSeconds, Math.floor(status.durationMillis / 1000)));
        if (status.durationMillis >= voiceLimits.maxSeconds * 1000) void stopRecording();
      });
      setPhase('recording');
    } catch (reason) {
      if (alive.current) {
        setPhase('idle');
        setVoiceError(reason instanceof Error ? reason.message : 'Mikrofon jest niedostępny. Sprawdź uprawnienia lub wpisz opis ręcznie.');
      }
    } finally {
      locked.current = false;
    }
  }, [stopRecording]);

  const retryRecognition = useCallback(async () => {
    if (locked.current || !pendingUri.current) return;
    locked.current = true;
    setVoiceError(''); setRecognized(false);
    try { await recognize(pendingUri.current); }
    finally {
      locked.current = false;
      if (alive.current) setPhase('idle');
    }
  }, [recognize]);

  return {
    recording: phase === 'recording',
    recordBusy: phase === 'starting' || phase === 'stopping' || phase === 'transcribing',
    transcribing: phase === 'transcribing',
    seconds, voiceError, hasPendingRecording, recognized, toggleRecording, retryRecognition,
  };
}
