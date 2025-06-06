
"use client";

import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Camera, Mic, PlaySquare, ScreenShare, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ScreenCaptureModuleProps {
  onRecordingComplete: (videoData: { url: string; duration: number }) => void;
}

const ScreenCaptureModule: FC<ScreenCaptureModuleProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const previousVideoUrlRef = useRef<string | null>(null);


  useEffect(() => {
    if (useWebcam) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
           // Store stream to stop it when webcam is toggled off
          (webcamVideoRef.current as any).webcamStream = stream;
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings for webcam preview.',
          });
        }
      };
      getCameraPermission();
    } else {
      if (webcamVideoRef.current && (webcamVideoRef.current as any).webcamStream) {
        const stream = (webcamVideoRef.current as any).webcamStream as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        (webcamVideoRef.current as any).webcamStream = null;
        if(webcamVideoRef.current) webcamVideoRef.current.srcObject = null;

      }
      setHasCameraPermission(false);
    }
     // Cleanup function to stop webcam stream when component unmounts or useWebcam changes
    return () => {
      if ((webcamVideoRef.current as any)?.webcamStream) {
        const stream = (webcamVideoRef.current as any).webcamStream as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useWebcam, toast]);


  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // setIsRecording(false) will be called in onstop
    } else {
      setIsRecording(true); // Set loading state immediately
      recordedChunksRef.current = [];

      // Revoke previous blob URL if it exists
      if (previousVideoUrlRef.current) {
        URL.revokeObjectURL(previousVideoUrlRef.current);
        previousVideoUrlRef.current = null;
      }

      try {
        const videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" as const }, // Explicitly type 'always'
        });

        videoStream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        };
        
        let combinedStreamTracks = [...videoStream.getVideoTracks()];

        if (useMicrophone) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => combinedStreamTracks.push(track));
          } catch (micError) {
            console.error("Microphone access error:", micError);
            toast({
              title: "Microphone Unavailable",
              description: "Recording screen without microphone.",
              variant: "destructive",
            });
          }
        }
        
        const finalStream = new MediaStream(combinedStreamTracks);
        streamRef.current = finalStream;

        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn(`${options.mimeType} is not supported. Trying 'video/webm'.`);
          options.mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn(`${options.mimeType} is not supported. Using browser default.`);
            options = {} as any; // Let browser decide
          }
        }

        mediaRecorderRef.current = new MediaRecorder(finalStream, options);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const mimeType = options.mimeType || 'video/webm'; // Default if browser picked
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);
          previousVideoUrlRef.current = videoUrl; // Store for future revocation
          
          const tempVideoEl = document.createElement('video');
          tempVideoEl.onloadedmetadata = () => {
            onRecordingComplete({ url: videoUrl, duration: tempVideoEl.duration });
          };
          tempVideoEl.onerror = () => {
             console.error("Error loading video metadata for duration.");
             onRecordingComplete({ url: videoUrl, duration: 0 });
          }
          tempVideoEl.src = videoUrl;

          setIsRecording(false);
          toast({ title: "Recording Stopped", description: "Video processing complete." });
          
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          recordedChunksRef.current = [];
        };

        mediaRecorderRef.current.start();
        toast({ title: "Recording Started", description: "Capturing your screen..." });

      } catch (error: any) {
        console.error("Error starting recording:", error);
        toast({
          title: "Recording Error",
          description: `Could not start recording: ${error.message || 'Permission denied or no screen selected.'}`,
          variant: "destructive",
        });
        setIsRecording(false);
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  return (
    <Card className="bg-card border-sidebar-border shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-lg text-sidebar-foreground">Screen Recording</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" className="w-full border-primary/50 text-primary-foreground/80 hover:bg-primary/10 hover:text-primary-foreground" onClick={handleToggleRecording} disabled={isRecording && mediaRecorderRef.current?.state !== 'inactive' && mediaRecorderRef.current?.state !== 'paused' }>
          <ScreenShare className="mr-2 h-4 w-4 text-secondary" /> Select Source & Start/Stop
        </Button>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="webcam-switch" className="flex items-center text-sidebar-foreground/80">
            <Camera className="mr-2 h-4 w-4 text-secondary" />
            Webcam Preview
          </Label>
          <Switch id="webcam-switch" checked={useWebcam} onCheckedChange={setUseWebcam} />
        </div>

        {useWebcam && (
          <div className="space-y-2">
            <video ref={webcamVideoRef} className="w-full aspect-video rounded-md bg-black border border-sidebar-border" autoPlay muted playsInline />
            {!hasCameraPermission && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                  Enable camera permissions for webcam preview.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="mic-switch" className="flex items-center text-sidebar-foreground/80">
            <Mic className="mr-2 h-4 w-4 text-secondary" />
            Microphone
          </Label>
          <Switch id="mic-switch" checked={useMicrophone} onCheckedChange={setUseMicrophone} disabled={isRecording} />
        </div>

        <Button onClick={handleToggleRecording} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isRecording ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording... (Click to Stop)
            </>
          ) : (
            <>
              <PlaySquare className="mr-2 h-4 w-4" /> Start Recording
            </>
          )}
        </Button>
        <p className="text-xs text-sidebar-foreground/60 text-center">
          Note: "Select Source" button initiates recording. The "Start/Stop Recording" button below is an alternative trigger.
        </p>
      </CardContent>
    </Card>
  );
};

export default ScreenCaptureModule;

    