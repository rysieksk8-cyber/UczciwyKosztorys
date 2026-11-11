import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { voiceLimits } from '@/constants/voice';
import { createSystemSpeechSession, getSystemSpeechAvailability } from '@/services/systemSpeech';
import { systemSpeechError } from '@/services/systemSpeechTypes';
import type { SystemSpeechAvailability, SystemSpeechSession } from '@/services/systemSpeechTypes';

type VoicePhase = 'idle' | 'starting' | 'recording' | 'finishing';
interface VoiceOptions { onRecognized: (text: string) => void }

export function useVoiceRecognition({ onRecognized }: VoiceOptions) {
  const [availability, setAvailability] = useState<SystemSpeechAvailability | null>(null);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [recognized, setRecognized] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const phaseRef = useRef<VoicePhase>('idle');
  const sessionRef = useRef<SystemSpeechSession | null>(null);
  const finalText = useRef<string[]>([]);
  const interimText = useRef('');
  const alive = useRef(true);
  const callback = useRef(onRecognized);
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  callback.current = onRecognized;

  const clearTimers = useCallback(() => {
    if (clock.current) clearInterval(clock.current);
    if (startTimeout.current) clearTimeout(startTimeout.current);
    if (stopTimeout.current) clearTimeout(stopTimeout.current);
    clock.current = null;
    startTimeout.current = null;
    stopTimeout.current = null;
  }, []);

  const updatePhase = useCallback((next: VoicePhase) => {
    phaseRef.current = next;
    if (alive.current) setPhase(next);
  }, []);

  const complete = useCallback((reportEmpty = true) => {
    clearTimers();
    const current = sessionRef.current;
    sessionRef.current = null;
    current?.dispose();
    const text = [...finalText.current, interimText.current].filter(part => part.trim()).join(' ').trim();
    finalText.current = [];
    interimText.current = '';
    if (alive.current) {
      if (text) {
        callback.current(text);
        setRecognized(true);
      } else if (reportEmpty) {
        setVoiceError(systemSpeechError('no-speech'));
      }
      setLiveTranscript('');
      updatePhase('idle');
    }
  }, [clearTimers, updatePhase]);

  const stopRecording = useCallback(() => {
    if (phaseRef.current !== 'recording' || !sessionRef.current) return;
    updatePhase('finishing');
    if (clock.current) clearInterval(clock.current);
    clock.current = null;
    // Some system services omit the end event. Preserve available text and release the UI.
    stopTimeout.current = setTimeout(() => {
      if (!alive.current || !sessionRef.current) return;
      setVoiceError('System nie przesłał końcowego wyniku na czas. Zachowano dostępny tekst; sprawdź go przed przejściem dalej.');
      complete(false);
    }, 8000);
    try { sessionRef.current.stop(); }
    catch {
      setVoiceError('System przerwał dyktowanie. Sprawdź zachowany tekst i spróbuj ponownie.');
      complete(false);
    }
  }, [complete, updatePhase]);

  useEffect(() => {
    alive.current = true;
    const refreshAvailability = () => {
      if (alive.current) setAvailability(getSystemSpeechAvailability());
    };
    refreshAvailability();
    // Recheck if the user enables the phone's speech service in device settings.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && phaseRef.current === 'idle') refreshAvailability();
    });
    return () => {
      alive.current = false;
      subscription.remove();
      clearTimers();
      const current = sessionRef.current;
      sessionRef.current = null;
      current?.dispose();
    };
  }, [clearTimers]);

  const toggleRecording = useCallback(async () => {
    if (phaseRef.current === 'recording') { stopRecording(); return; }
    if (phaseRef.current !== 'idle') return;
    const support = getSystemSpeechAvailability();
    setAvailability(support);
    if (!support.available) {
      setVoiceError('');
      return;
    }
    updatePhase('starting');
    setVoiceError('');
    setRecognized(false);
    setSeconds(0);
    setLiveTranscript('');
    finalText.current = [];
    interimText.current = '';
    let current: SystemSpeechSession | null = null;
    const isCurrent = () => alive.current && current !== null && sessionRef.current === current;
    try {
      current = createSystemSpeechSession({
        onStart: () => {
          if (!isCurrent() || phaseRef.current !== 'starting') return;
          if (startTimeout.current) clearTimeout(startTimeout.current);
          startTimeout.current = null;
          updatePhase('recording');
          const startedAt = Date.now();
          clock.current = setInterval(() => {
            if (!isCurrent() || phaseRef.current !== 'recording') return;
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            setSeconds(Math.min(voiceLimits.maxSeconds, elapsed));
            if (elapsed >= voiceLimits.maxSeconds) stopRecording();
          }, 250);
        },
        onResult: (text, isFinal) => {
          if (!isCurrent()) return;
          if (isFinal) {
            if (text.trim()) finalText.current.push(text.trim());
            interimText.current = '';
          } else {
            interimText.current = text.trim();
          }
          setLiveTranscript([...finalText.current, interimText.current].filter(Boolean).join(' '));
        },
        onError: code => {
          if (!isCurrent()) return;
          const hasText = finalText.current.length > 0 || Boolean(interimText.current.trim());
          if ((code === 'no-speech' || code === 'speech-timeout') && hasText) {
            complete(false);
            return;
          }
          setVoiceError(systemSpeechError(code));
          complete(false);
        },
        onEnd: () => { if (isCurrent()) complete(); },
      });
      sessionRef.current = current;
      await current.start();
      if (isCurrent() && phaseRef.current === 'starting') {
        startTimeout.current = setTimeout(() => {
          if (!isCurrent()) return;
          setVoiceError('System nie uruchomił mikrofonu. Sprawdź uprawnienia oraz dostępność usługi mowy. W podglądzie przeglądarkowym funkcja może być blokowana.');
          complete(false);
        }, 20000);
      }
    } catch (reason) {
      if (!alive.current) { current?.dispose(); return; }
      if (current && sessionRef.current !== current) return;
      setVoiceError(reason instanceof Error ? reason.message : systemSpeechError('unknown'));
      complete(false);
    }
  }, [complete, stopRecording, updatePhase]);

  return {
    voiceAvailable: availability?.available ?? false,
    voiceChecking: availability === null,
    voiceUnavailableReason: availability?.reason ?? '',
    recording: phase === 'recording',
    recordBusy: phase === 'starting' || phase === 'finishing',
    finishing: phase === 'finishing',
    seconds,
    voiceError,
    recognized,
    liveTranscript,
    toggleRecording,
  };
}
