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
import EnhancedVideoPreview from '@/components/video/EnhancedVideoPreview';
import TimelineEditor from '@/components/editor/TimelineEditor';
import CaptionEditor from '@/components/editor/CaptionEditor';
import type { CaptionTrack, CaptionItem } from '@/components/editor/CaptionEditor';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { GenerateEditDecisionListOutput } from '@/ai/flows/generate-edit-decision-list';
import { srtToVtt } from '@/lib/utils';


export default function Home() {
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [webcamVideoUrl, setWebcamVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [vttDataUrl, setVttDataUrl] = useState<string | null>(null);

  const [currentEdl, setCurrentEdl] = useState<EditDecision[] | null>(null);
  const [voiceoverData, setVoiceoverData] = useState<{ script: string; audioUrl?: string } | null>(null);
  const [captionsData, setCaptionsData] = useState<string | null>(null);
  const [userVoiceover, setUserVoiceover] = useState<{ url: string; duration: number } | null>(null);
  
  // New state for enhanced caption functionality
  const [captionTracks, setCaptionTracks] = useState<CaptionTrack[]>([]);

  const handleRecordingComplete = useCallback((videoData: { 
    screenRecording?: { url: string; duration: number };
    webcamRecording?: { url: string; duration: number };
  }) => {
    if (videoData.screenRecording) {
      setRecordedVideoUrl(videoData.screenRecording.url);
      setVideoDuration(videoData.screenRecording.duration);
    }
    if (videoData.webcamRecording) {
      setWebcamVideoUrl(videoData.webcamRecording.url);
      // Set duration from webcam if no screen recording is available
      if (!videoData.screenRecording) {
        setVideoDuration(videoData.webcamRecording.duration);
      }
    }
    
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentEdl(null);
    setVoiceoverData(null);
    setCaptionsData(null);
    setVttDataUrl(null);
    setUserVoiceover(null);
    setCaptionTracks([]); // Reset caption tracks for new video
    
    if (videoRef.current && videoData.screenRecording) {
      videoRef.current.src = videoData.screenRecording.url;
      videoRef.current.load();
    }
    if (webcamVideoRef.current && videoData.webcamRecording) {
      webcamVideoRef.current.src = videoData.webcamRecording.url;
      webcamVideoRef.current.load();
    }
    if (audioRef.current) {
      audioRef.current.src = "";
      audioRef.current.load();
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
    const vtt = srtToVtt(captions);
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    setVttDataUrl(url);

    // Convert SRT to caption tracks
    const parsedCaptions = parseSrtToCaptions(captions);
    if (parsedCaptions.length > 0) {
      const newTrack: CaptionTrack = {
        id: `ai-track-${Date.now()}`,
        name: 'AI Generated Captions',
        language: 'en',
        captions: parsedCaptions,
        isVisible: true
      };
      setCaptionTracks(prev => [...prev, newTrack]);
    }
  };

  const parseSrtToCaptions = (srtText: string): CaptionItem[] => {
    if (!srtText) return [];
    
    const captionItems: CaptionItem[] = [];
    
    srtText.split('\n\n').forEach((block, index) => {
      const lines = block.split('\n');
      if (lines.length < 2) return;
      
      const timeMatch = lines.find(line => line.includes('-->'))?.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3}) --> (\d{2}:\d{2}:\d{2}[,.]\d{3})/);
      if (!timeMatch) return;
      
      const timeToSeconds = (ts: string) => {
        const [hms, msPart] = ts.split(/[,.]/);
        const [h, m, s] = hms.split(':');
        return parseInt(h)*3600 + parseInt(m)*60 + parseInt(s) + parseInt(msPart)/1000;
      };
      
      const textLines = lines.slice(lines.findIndex(line => line.includes('-->')) + 1);
      const text = textLines.join(' ').trim();
      
      if (!text) return;
      
      captionItems.push({
        id: `ai-caption-${index}-${Date.now()}`,
        startTime: timeToSeconds(timeMatch[1]),
        endTime: timeToSeconds(timeMatch[2]),
        text,
        style: {
          fontSize: 16,
          color: '#FFFFFF',
          backgroundColor: '#000000',
          position: { x: 50, y: 85 },
          width: 80,
          textAlign: 'center',
          fontWeight: 'normal'
        }
      });
    });
    
    return captionItems;
  };

  const handleUserVoiceoverRecorded = (audio: { url: string; duration: number }) => {
    setUserVoiceover(audio);
    setVoiceoverData(null); 
  };

  const handleDeleteEdit = (id: string) => {
    setCurrentEdl(currentEdl => currentEdl ? currentEdl.filter(edit => edit.id !== id) : null);
  };

  const handleUpdateEdit = (id: string, updates: Partial<EditDecision>) => {
    setCurrentEdl(currentEdl => 
      currentEdl 
        ? currentEdl.map(edit => edit.id === id ? { ...edit, ...updates } : edit) 
        : null
    );
  };

  const handleDeleteCaption = (trackId: string, captionId: string) => {
    setCaptionTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, captions: track.captions.filter(caption => caption.id !== captionId) }
          : track
      )
    );
  };

  const handleDeleteCaptionTrack = (trackId: string) => {
    setCaptionTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
  };

  const handleToggleCaptionTrackVisibility = (trackId: string) => {
    setCaptionTracks(prevTracks => 
      prevTracks.map(track => 
        track.id === trackId 
          ? { ...track, isVisible: !track.isVisible }
          : track
      )
    );
  };

  const handlePlayPause = useCallback(() => {
    // Synchronize playback across all available video elements
    if (videoRef.current && recordedVideoUrl) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(err => console.error("Error playing screen video:", err));
      } else {
        videoRef.current.pause();
      }
    }
    
    if (webcamVideoRef.current && webcamVideoUrl) {
      if (webcamVideoRef.current.paused || webcamVideoRef.current.ended) {
        webcamVideoRef.current.play().catch(err => console.error("Error playing webcam video:", err));
      } else {
        webcamVideoRef.current.pause();
      }
    }
    
    if (audioRef.current && (userVoiceover?.url || voiceoverData?.audioUrl)) {
      if (audioRef.current.paused || audioRef.current.ended) {
        audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [recordedVideoUrl, webcamVideoUrl, userVoiceover?.url, voiceoverData?.audioUrl]);

  const handleSeek = useCallback((time: number) => {
    // Synchronize seek across all video elements
    setCurrentTime(time);
    
    if (videoRef.current && recordedVideoUrl) {
      videoRef.current.currentTime = time;
    }
    
    if (webcamVideoRef.current && webcamVideoUrl) {
      webcamVideoRef.current.currentTime = time;
    }
    
    if (audioRef.current && (userVoiceover?.url || voiceoverData?.audioUrl)) {
      audioRef.current.currentTime = time;
    }
  }, [recordedVideoUrl, webcamVideoUrl, userVoiceover?.url, voiceoverData?.audioUrl]);
  
  const handleTimeUpdate = useCallback(() => {
    // Use the primary video source for time updates (prioritize screen, then webcam)
    const primaryVideo = recordedVideoUrl ? videoRef.current : webcamVideoRef.current;
    if (primaryVideo) {
      setCurrentTime(primaryVideo.currentTime);
    }
  }, [recordedVideoUrl]);

  const handleLoadedMetadata = useCallback(() => {
    // Use the primary video source for duration (prioritize screen recording)
    const primaryVideo = recordedVideoUrl ? videoRef.current : webcamVideoRef.current;
    if (primaryVideo) {
      const rawDuration = primaryVideo.duration;
      const newDuration = (Number.isFinite(rawDuration) && rawDuration >= 0) ? rawDuration : 0;
      setVideoDuration(newDuration);
    }
  }, [recordedVideoUrl]);

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
                videoData={(recordedVideoUrl || webcamVideoUrl) && videoDuration > 0 ? { 
                  url: (recordedVideoUrl || webcamVideoUrl)!, 
                  duration: videoDuration 
                } : null}
                onEdlGenerated={handleEdlGenerated}
                onVoiceoverGenerated={handleVoiceoverGenerated}
                onCaptionsGenerated={handleCaptionsGenerated}
                onUserVoiceoverRecorded={handleUserVoiceoverRecorded}
              />
              <Separator className="my-6 bg-sidebar-border" />
              <ExportModule 
                videoData={(recordedVideoUrl || webcamVideoUrl) && videoDuration > 0 ? { 
                  url: (recordedVideoUrl || webcamVideoUrl)!, 
                  duration: videoDuration 
                } : null}
                edl={currentEdl}
                userVoiceover={userVoiceover}
                captionsData={captionsData}
              />
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
            <EnhancedVideoPreview
              videoSrc={recordedVideoUrl}
              webcamSrc={webcamVideoUrl}
              videoRef={videoRef as RefObject<HTMLVideoElement>}
              webcamVideoRef={webcamVideoRef as RefObject<HTMLVideoElement>}
              audioRef={audioRef as RefObject<HTMLAudioElement>}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              subtitlesSrc={vttDataUrl}
              voiceoverSrc={userVoiceover?.url || voiceoverData?.audioUrl}
              captionTracks={captionTracks}
              currentTime={currentTime}
              className="min-h-[300px] md:min-h-[400px]"
            />
            
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="captions">Captions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="mt-6">
                <TimelineEditor
                  edl={currentEdl}
                  videoDuration={videoDuration}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onSeek={handleSeek}
                  onDeleteEdit={handleDeleteEdit}
                  onUpdateEdit={handleUpdateEdit}
                  voiceoverScript={voiceoverData?.script}
                  voiceoverAudioUrl={voiceoverData?.audioUrl}
                  userVoiceoverUrl={userVoiceover?.url}
                  captionsData={captionsData}
                  captionTracks={captionTracks}
                  webcamVideoUrl={webcamVideoUrl}
                  className="min-h-[300px] md:min-h-[400px]"
                />
              </TabsContent>
              
              <TabsContent value="captions" className="mt-6">
                <CaptionEditor
                  captionTracks={captionTracks}
                  onCaptionTracksChange={setCaptionTracks}
                  videoDuration={videoDuration}
                  currentTime={currentTime}
                  className="min-h-[300px] md:min-h-[400px]"
                />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
