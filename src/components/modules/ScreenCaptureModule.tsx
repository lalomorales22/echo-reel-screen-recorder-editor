"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, Mic, PlaySquare, ScreenShare, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScreenCaptureModuleProps {
  onRecordingComplete: (videoData: { url: string; duration: number }) => void;
}

const ScreenCaptureModule: FC<ScreenCaptureModuleProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(true);
  const { toast } = useToast();

  const handleToggleRecording = () => {
    if (isRecording) {
      // Simulate stopping recording
      setIsRecording(false);
      const mockVideoData = {
        url: 'https://placehold.co/1280x720.png?text=Screen+Recording+Preview',
        duration: Math.floor(Math.random() * 180) + 60, // Random duration 60-240s
      };
      onRecordingComplete(mockVideoData);
      toast({ title: "Recording Stopped", description: "Video processing..." });
    } else {
      // Simulate starting recording
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Capturing your screen..." });
    }
  };

  return (
    <Card className="bg-card border-sidebar-border shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-lg text-sidebar-foreground">Screen Recording</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" className="w-full border-primary/50 text-primary-foreground/80 hover:bg-primary/10 hover:text-primary-foreground">
          <ScreenShare className="mr-2 h-4 w-4 text-secondary" /> Select Area (Full Screen)
        </Button>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="webcam-switch" className="flex items-center text-sidebar-foreground/80">
            <Camera className="mr-2 h-4 w-4 text-secondary" />
            Webcam
          </Label>
          <Switch id="webcam-switch" checked={useWebcam} onCheckedChange={setUseWebcam} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="mic-switch" className="flex items-center text-sidebar-foreground/80">
            <Mic className="mr-2 h-4 w-4 text-secondary" />
            Microphone
          </Label>
          <Switch id="mic-switch" checked={useMicrophone} onCheckedChange={setUseMicrophone} />
        </div>

        <Button onClick={handleToggleRecording} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isRecording ? (
            <>
              <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
            </>
          ) : (
            <>
              <PlaySquare className="mr-2 h-4 w-4" /> Start Recording
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScreenCaptureModule;
