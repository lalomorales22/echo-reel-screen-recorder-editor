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
  onRecordingComplete: (videoData: { 
    screenRecording?: { url: string; duration: number };
    webcamRecording?: { url: string; duration: number };
  }) => void;
}

const ScreenCaptureModule: FC<ScreenCaptureModuleProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [recordWebcam, setRecordWebcam] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const webcamChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const previousVideoUrlRef = useRef<string | null>(null);
  const previousWebcamUrlRef = useRef<string | null>(null);


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
      // Stop both recordings
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (webcamRecorderRef.current && webcamRecorderRef.current.state === "recording") {
        webcamRecorderRef.current.stop();
      }
    } else {
      setIsRecording(true);
      recordedChunksRef.current = [];
      webcamChunksRef.current = [];

      // Revoke previous blob URLs if they exist
      if (previousVideoUrlRef.current) {
        URL.revokeObjectURL(previousVideoUrlRef.current);
        previousVideoUrlRef.current = null;
      }
      if (previousWebcamUrlRef.current) {
        URL.revokeObjectURL(previousWebcamUrlRef.current);
        previousWebcamUrlRef.current = null;
      }

      try {
        // Start screen recording
        const videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            cursor: "always" as const
          } as MediaTrackConstraints & { cursor?: string },
        });

        videoStream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          if (webcamRecorderRef.current && webcamRecorderRef.current.state === "recording") {
            webcamRecorderRef.current.stop();
          }
          setIsRecording(false);
          streamRef.current?.getTracks().forEach(track => track.stop());
          webcamStreamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          webcamStreamRef.current = null;
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

        // Start webcam recording if enabled
        if (recordWebcam && useWebcam) {
          try {
            const webcamStream = await navigator.mediaDevices.getUserMedia({ 
              video: true,
              audio: false // Audio is already captured from microphone
            });
            webcamStreamRef.current = webcamStream;

            // Set up webcam recorder
            let webcamOptions = { mimeType: 'video/webm;codecs=vp9' };
            if (!MediaRecorder.isTypeSupported(webcamOptions.mimeType)) {
              webcamOptions.mimeType = 'video/webm';
              if (!MediaRecorder.isTypeSupported(webcamOptions.mimeType)) {
                webcamOptions = {} as any;
              }
            }

            webcamRecorderRef.current = new MediaRecorder(webcamStream, webcamOptions);

            webcamRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0) {
                webcamChunksRef.current.push(event.data);
              }
            };

            webcamRecorderRef.current.onstop = () => {
              const mimeType = webcamOptions.mimeType || 'video/webm';
              const blob = new Blob(webcamChunksRef.current, { type: mimeType });
              const webcamUrl = URL.createObjectURL(blob);
              previousWebcamUrlRef.current = webcamUrl;
              
              const tempVideoEl = document.createElement('video');
              tempVideoEl.onloadedmetadata = () => {
                const rawDuration = tempVideoEl.duration;
                const videoDuration = (Number.isFinite(rawDuration) && rawDuration > 0) ? rawDuration : 0;
                
                // Check if screen recording is also complete
                if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                  onRecordingComplete({ 
                    screenRecording: previousVideoUrlRef.current ? 
                      { url: previousVideoUrlRef.current, duration: videoDuration } : undefined,
                    webcamRecording: { url: webcamUrl, duration: videoDuration }
                  });
                }
              };
              tempVideoEl.src = webcamUrl;
            };

            webcamRecorderRef.current.start();
          } catch (webcamError) {
            console.error("Webcam recording error:", webcamError);
            toast({
              title: "Webcam Recording Failed",
              description: "Could not access webcam for recording.",
              variant: "destructive",
            });
          }
        }

        // Set up screen recorder
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn(`${options.mimeType} is not supported. Trying 'video/webm'.`);
          options.mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn(`${options.mimeType} is not supported. Using browser default.`);
            options = {} as any;
          }
        }

        mediaRecorderRef.current = new MediaRecorder(finalStream, options);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const mimeType = options.mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);
          previousVideoUrlRef.current = videoUrl;
          
          const tempVideoEl = document.createElement('video');
          tempVideoEl.onloadedmetadata = () => {
            const rawDuration = tempVideoEl.duration;
            const videoDuration = (Number.isFinite(rawDuration) && rawDuration > 0) ? rawDuration : 0;
            
            // Prepare recording data
            const recordingData: { 
              screenRecording?: { url: string; duration: number };
              webcamRecording?: { url: string; duration: number };
            } = {
              screenRecording: { url: videoUrl, duration: videoDuration }
            };

            // Add webcam data if it was recorded
            if (previousWebcamUrlRef.current) {
              recordingData.webcamRecording = { 
                url: previousWebcamUrlRef.current, 
                duration: videoDuration 
              };
            }

            onRecordingComplete(recordingData);
          };
          
          tempVideoEl.onerror = (e) => {
             console.error("Error loading video metadata for duration:", e);
             onRecordingComplete({ screenRecording: { url: videoUrl, duration: 0 } });
          }
          tempVideoEl.src = videoUrl;

          setIsRecording(false);
          toast({ title: "Recording Stopped", description: "Video processing complete." });
          
          streamRef.current?.getTracks().forEach(track => track.stop());
          webcamStreamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          webcamStreamRef.current = null;
          recordedChunksRef.current = [];
          webcamChunksRef.current = [];
        };

        mediaRecorderRef.current.start();
        toast({ title: "Recording Started", description: recordWebcam && useWebcam ? "Capturing screen and webcam..." : "Capturing your screen..." });

      } catch (error: any) {
        console.error("Error starting recording:", error);
        let description = `Could not start recording: ${error.message || 'Permission denied or no screen selected.'}`;
        if (error.message && (error.message.includes("disallowed by permissions policy") || error.message.includes("display-capture"))) {
          description = "Screen recording is disallowed by the current browser or environment's permissions policy.";
        } else if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
            description = "Screen recording permission was denied. Please allow access to your screen to start recording.";
        }
        
        toast({
          title: "Recording Error",
          description: description,
          variant: "destructive",
        });
        setIsRecording(false);
        streamRef.current?.getTracks().forEach(track => track.stop());
        webcamStreamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        webcamStreamRef.current = null;
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
          <>
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
            
            <div className="flex items-center justify-between">
              <Label htmlFor="record-webcam-switch" className="flex items-center text-sidebar-foreground/80">
                <Camera className="mr-2 h-4 w-4 text-secondary" />
                Record Webcam
              </Label>
              <Switch 
                id="record-webcam-switch" 
                checked={recordWebcam} 
                onCheckedChange={setRecordWebcam}
                disabled={isRecording || !hasCameraPermission}
              />
            </div>
          </>
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

