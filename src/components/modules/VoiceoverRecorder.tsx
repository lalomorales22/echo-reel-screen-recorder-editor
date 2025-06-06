"use client";

import { useState, useRef } from 'react';
import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Waves } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VoiceoverRecorderProps {
  onRecordingComplete: (audio: { url: string; duration: number }) => void;
  videoDuration: number;
}

const VoiceoverRecorder: FC<VoiceoverRecorderProps> = ({ onRecordingComplete, videoDuration }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        const duration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;
        onRecordingComplete({ url: audioUrl, duration });
        // Clean up stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
    } catch (err) {
      console.error("Error starting recording:", err);
      // TODO: Show an error message to the user
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  return (
    <Card className="bg-card/60">
      <CardHeader>
        <CardTitle className="text-md font-headline">Record Voiceover</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Record your own voiceover for the video.
        </p>
        <Button onClick={handleToggleRecording} disabled={!videoDuration}>
          {isRecording ? <StopCircle className="mr-2" /> : <Mic className="mr-2" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
        {isRecording && (
          <div className="flex items-center text-sm text-destructive animate-pulse">
            <Waves className="mr-2 h-4 w-4" />
            <span>Recording...</span>
          </div>
        )}
        {recordedAudioUrl && !isRecording && (
           <div className="w-full pt-2">
            <p className="text-xs text-center text-muted-foreground mb-1">Voiceover Preview:</p>
            <audio src={recordedAudioUrl} controls className="w-full h-10" />
           </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceoverRecorder; 