import { useState, useRef } from 'react';

type UseRecordingReturn = {
  isRecording: boolean;
  isUploading: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
};

export default function useRecording(sttUrl: string, apiKey?: string): UseRecordingReturn {
  const recordingRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = async () => {
    try {
      // dynamic require so code doesn't break if expo-av isn't installed in some envs
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Audio } = require('expo-av');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      console.warn('useRecording.startRecording err', e);
      throw e;
    }
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return null;
    setIsRecording(false);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      if (!uri) return null;

      setIsUploading(true);
      // dynamic require for FileSystem
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FileSystem = require('expo-file-system');
      const fileName = uri.split('/').pop() || 'recording.m4a';

      const formData = new FormData();
      // @ts-ignore
      formData.append('file', { uri, name: fileName, type: 'audio/m4a' });

      const headers: any = {};
      if (apiKey) headers['x-stt-key'] = apiKey;

      const res = await fetch(sttUrl, { method: 'POST', body: formData, headers });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'stt server error');
      }
      const data = await res.json();
      const text = data?.text ?? '';
      setIsUploading(false);
      return text || null;
    } catch (e) {
      setIsUploading(false);
      console.warn('useRecording.stopRecording err', e);
      throw e;
    }
  };

  return { isRecording, isUploading, startRecording, stopRecording };
}
