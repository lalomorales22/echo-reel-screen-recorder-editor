
"use client";

import { useState, useRef, useCallback }
from 'react';
import type { RefObject } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader as ShadSidebarHeader, SidebarContent as ShadSidebarContent, SidebarFooter as ShadSidebarFooter, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppHeader from '@/components/layout/AppHeader';
import ScreenCaptureModule from '@/components/modules/ScreenCaptureModule';
import AiToolsModule from '@/components/modules/AiToolsModule';
import type { EditDecision } from '@/components/modules/AiToolsModule';
import ExportModule from '@/components/modules/ExportModule';
import VideoPreview from '@/components/video/VideoPreview';
import TimelineEditor from '@/components/editor/TimelineEditor';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GenerateEditDecisionListOutput } from '@/ai/flows/generate-edit-decision-list';


export default function Home() {
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [currentEdl, setCurrentEdl] = useState<EditDecision[] | null>(null);
  const [voiceoverData, setVoiceoverData] = useState<{ script: string; audioUrl?: string } | null>(null);
  const [captionsData, setCaptionsData] = useState<string | null>(null);

  const handleRecordingComplete = useCallback((video: { url: string; duration: number }) => {
    setRecordedVideoUrl(video.url);
    setVideoDuration(video.duration); // Duration is already sanitized by ScreenCaptureModule
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentEdl(null); // Reset EDL for new video
    setVoiceoverData(null);
    setCaptionsData(null);
    if (videoRef.current) {
      videoRef.current.src = video.url;
      videoRef.current.load(); // Important to load new source
    }
  }, []);

  const handleEdlGenerated = (edl: GenerateEditDecisionListOutput['edl']) => {
    const mappedEdl: EditDecision[] = edl.map((item, index) => ({
      id: `edit-${Date.now()}-${index}`,
      startTime: item.startTime,
      endTime: item.endTime,
      action: item.action as 'cut' | 'zoom' | 'highlight',
      details: item.details
    }));
    setCurrentEdl(mappedEdl);
  };

  const handleVoiceoverGenerated = (script: string, audioUrl?: string) => {
    setVoiceoverData({ script, audioUrl });
  };

  const handleCaptionsGenerated = (captions: string) => {
    setCaptionsData(captions);
  };

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(err => console.error("Error playing video:", err));
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const rawDuration = videoRef.current.duration;
      // Sanitize duration to ensure it's a finite, non-negative number
      const newDuration = (Number.isFinite(rawDuration) && rawDuration >= 0) ? rawDuration : 0;
      setVideoDuration(newDuration);
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
  }, []);


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar side="left" className="w-80 md:w-96 border-r border-sidebar-border shadow-lg">
          <ShadSidebarHeader>
            <AppHeader />
          </ShadSidebarHeader>
          <ScrollArea className="h-[calc(100vh-120px)]">
            <ShadSidebarContent className="p-4 space-y-6">
              <ScreenCaptureModule onRecordingComplete={handleRecordingComplete} />
              <Separator className="my-6 bg-sidebar-border" />
              <AiToolsModule
                videoData={recordedVideoUrl ? { url: recordedVideoUrl, duration: videoDuration } : null}
                onEdlGenerated={handleEdlGenerated}
                onVoiceoverGenerated={handleVoiceoverGenerated}
                onCaptionsGenerated={handleCaptionsGenerated}
              />
              <Separator className="my-6 bg-sidebar-border" />
              <ExportModule videoData={recordedVideoUrl ? { url: recordedVideoUrl, duration: videoDuration } : null} />
            </ShadSidebarContent>
          </ScrollArea>
           <ShadSidebarFooter className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60 text-center">&copy; 2024 EchoReel</p>
          </ShadSidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1 flex flex-col overflow-y-auto">
           <header className="p-4 border-b border-border flex items-center sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <SidebarTrigger className="mr-4 md:hidden" />
            <h2 className="text-lg font-headline font-semibold text-foreground">Editor Workspace</h2>
          </header>
          <main className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-y-auto">
            <VideoPreview
              videoSrc={recordedVideoUrl}
              videoRef={videoRef as RefObject<HTMLVideoElement>}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              className="min-h-[300px] md:min-h-[400px]"
            />
            <TimelineEditor
              edl={currentEdl}
              videoDuration={videoDuration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              voiceoverScript={voiceoverData?.script}
              voiceoverAudioUrl={voiceoverData?.audioUrl}
              captionsData={captionsData}
              className="min-h-[300px] md:min-h-[400px]"
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
