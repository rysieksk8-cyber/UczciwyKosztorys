import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/template';
import { voiceLimits } from '@/constants/voice';

export async function startVoiceRecording(): Promise<Audio.Recording> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Zezwól na użycie mikrofonu w ustawieniach telefonu lub przeglądarki. Możesz też wpisać opis ręcznie.');
  }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const preset = Audio.RecordingOptionsPresets.HIGH_QUALITY;
  let mimeType = 'audio/webm';
  if (Platform.OS === 'web' && typeof MediaRecorder !== 'undefined') {
    mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
      .find(type => MediaRecorder.isTypeSupported(type)) || mimeType;
  }
  try {
    const { recording } = await Audio.Recording.createAsync({
      ...preset,
      android: { ...preset.android, sampleRate: voiceLimits.sampleRate, numberOfChannels: 1, bitRate: 64000 },
      ios: { ...preset.ios, sampleRate: voiceLimits.sampleRate, numberOfChannels: 1, bitRate: 64000 },
      web: { mimeType, bitsPerSecond: 64000 },
    });
    return recording;
  } catch {
    await resetAudioMode();
    throw new Error('Nie udało się uruchomić mikrofonu. Sprawdź uprawnienia. Jeśli podgląd w przeglądarce blokuje nagrywanie, użyj aplikacji na telefonie lub wpisz opis ręcznie.');
  }
}

export async function resetAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => undefined);
}

export async function finishVoiceRecording(recording: Audio.Recording): Promise<string> {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (!uri) throw new Error('Nie zapisano nagrania. Nagraj opis ponownie lub wpisz go ręcznie.');
    return uri;
  } catch (reason) {
    if (reason instanceof Error && /E_AUDIO_NODATA|no data/i.test(reason.message)) {
      throw new Error('Nagranie jest zbyt krótkie. Nagraj kilka sekund wypowiedzi i spróbuj ponownie.');
    }
    throw new Error('Nie udało się zapisać nagrania. Nagraj opis ponownie lub wpisz go ręcznie.');
  } finally {
    await resetAudioMode();
  }
}

export async function deleteVoiceFile(uri: string): Promise<void> {
  if (!uri) return;
  if (Platform.OS === 'web') {
    if (uri.startsWith('blob:') && typeof URL !== 'undefined') URL.revokeObjectURL(uri);
    return;
  }
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}

export async function discardVoiceRecording(recording: Audio.Recording): Promise<void> {
  recording.setOnRecordingStatusUpdate(null);
  await recording.stopAndUnloadAsync().catch(() => undefined);
  await resetAudioMode();
  await deleteVoiceFile(recording.getURI() || '');
}

// Browser recordings are normalized to mono WAV; native recordings use AAC/M4A.
function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const sampleRate = Math.min(voiceLimits.sampleRate, buffer.sampleRate);
  const length = Math.max(1, Math.floor(buffer.duration * sampleRate));
  if (buffer.duration > voiceLimits.maxSeconds + 3 || 44 + length * 2 > voiceLimits.maxAudioBytes) {
    throw new Error('Nagranie jest za długie. Nagraj opis o długości do 2 minut.');
  }
  const result = new ArrayBuffer(44 + length * 2);
  const view = new DataView(result);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeText(0, 'RIFF'); view.setUint32(4, 36 + length * 2, true);
  writeText(8, 'WAVE'); writeText(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeText(36, 'data'); view.setUint32(40, length * 2, true);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  const ratio = buffer.sampleRate / sampleRate;
  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(buffer.length, Math.max(start + 1, Math.floor((index + 1) * ratio)));
    let sample = 0;
    for (const channel of channels) {
      for (let source = start; source < end; source += 1) sample += channel[source] || 0;
    }
    sample = Math.max(-1, Math.min(1, sample / Math.max(1, (end - start) * channels.length)));
    view.setInt16(44 + index * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return result;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nie udało się odczytać nagrania.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
      if (!result) reject(new Error('Nagranie jest puste.'));
      else resolve(result);
    };
    reader.readAsDataURL(blob);
  });
}

async function audioPayload(uri: string): Promise<{ audio: string; format: 'wav' | 'm4a' }> {
  if (Platform.OS !== 'web') {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.size === 0) throw new Error('Nagranie jest puste. Nagraj opis ponownie.');
    if (info.size > voiceLimits.maxAudioBytes) throw new Error('Nagranie jest zbyt duże. Nagraj krótszy opis.');
    const audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return { audio, format: 'm4a' };
  }
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Nie udało się odczytać nagrania z przeglądarki.');
  const blob = await response.blob();
  if (!blob.size) throw new Error('Nagranie jest puste. Nagraj opis ponownie.');
  if (blob.size > voiceLimits.maxAudioBytes) throw new Error('Nagranie jest zbyt duże. Nagraj krótszy opis.');
  const browser = globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const Context = browser.AudioContext || browser.webkitAudioContext;
  if (!Context) throw new Error('Ta przeglądarka nie obsługuje odczytu nagrania. Użyj aplikacji na telefonie lub wpisz opis ręcznie.');
  const context = new Context();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const wav = encodeWav(decoded);
    return { audio: await blobToBase64(new Blob([wav], { type: 'audio/wav' })), format: 'wav' };
  } finally {
    await context.close().catch(() => undefined);
  }
}

export async function transcribePolishRecording(uri: string): Promise<string> {
  const body = await audioPayload(uri);
  if (body.audio.length > voiceLimits.maxBase64Length) throw new Error('Nagranie jest zbyt duże. Nagraj krótszy opis.');
  const { data, error } = await getSupabaseClient().functions.invoke('transcribe-polish', { body });
  if (error) {
    let message = 'Nie udało się połączyć z OnSpace AI. Sprawdź internet i spróbuj ponownie.';
    if (error instanceof FunctionsHttpError) {
      const status = error.context?.status;
      message = status === 402
        ? 'OnSpace AI zablokowało rozpoznawanie mowy (402 — wymagana płatność). Sprawdź rozliczenia i dostępne środki AI w OnSpace. W razie problemów napisz na contact@onspace.ai. Do tego czasu możesz wpisać opis ręcznie.'
        : `OnSpace AI: błąd usługi (${status || 'nieznany'}). Spróbuj ponownie.`;
      try {
        const text = await error.context.text();
        const details = JSON.parse(text);
        if (typeof details?.error === 'string' && details.error.trim()) message = details.error;
      } catch {
        // Keep the actionable status-specific message if the gateway returns non-JSON.
      }
    }
    throw new Error(message);
  }
  if (typeof data?.error === 'string') throw new Error(data.error);
  if (typeof data?.transcript !== 'string' || !data.transcript.trim()) {
    throw new Error('Nie rozpoznano mowy. Mów wyraźnie, bliżej mikrofonu, lub wpisz opis ręcznie.');
  }
  return data.transcript.trim();
}
