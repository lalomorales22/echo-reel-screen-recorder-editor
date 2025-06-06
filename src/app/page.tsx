"use client";

import { useState } from 'react';
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
  const [currentVideo, setCurrentVideo] = useState<{ url: string; duration: number } | null>(null);
  const [currentEdl, setCurrentEdl] = useState<EditDecision[] | null>(null);
  const [voiceoverData, setVoiceoverData] = useState<{ script: string; audioUrl?: string } | null>(null);
  const [captionsData, setCaptionsData] = useState<string | null>(null);

  const handleRecordingComplete = (video: { url: string; duration: number }) => {
    setCurrentVideo(video);
    setCurrentEdl(null); // Reset EDL for new video
    setVoiceoverData(null);
    setCaptionsData(null);
  };

  const handleEdlGenerated = (edl: GenerateEditDecisionListOutput['edl']) => {
    // Map AI flow output to internal EditDecision type if necessary, or ensure types are compatible
    const mappedEdl: EditDecision[] = edl.map((item, index) => ({
      id: `edit-${Date.now()}-${index}`, // Ensure unique ID for keys
      startTime: item.startTime,
      endTime: item.endTime,
      action: item.action as 'cut' | 'zoom' | 'highlight', // Cast if types are slightly different
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

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar side="left" className="w-80 md:w-96 border-r border-sidebar-border shadow-lg">
          <ShadSidebarHeader>
            <AppHeader />
          </ShadSidebarHeader>
          <ScrollArea className="h-[calc(100vh-120px)]"> {/* Adjust height based on header/footer */}
            <ShadSidebarContent className="p-4 space-y-6">
              <ScreenCaptureModule onRecordingComplete={handleRecordingComplete} />
              <Separator className="my-6 bg-sidebar-border" />
              <AiToolsModule
                videoData={currentVideo}
                onEdlGenerated={handleEdlGenerated}
                onVoiceoverGenerated={handleVoiceoverGenerated}
                onCaptionsGenerated={handleCaptionsGenerated}
              />
              <Separator className="my-6 bg-sidebar-border" />
              <ExportModule videoData={currentVideo} /> {/* Pass final edited video data here */}
            </ShadSidebarContent>
          </ScrollArea>
           <ShadSidebarFooter className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/60 text-center">&copy; 2024 EchoReel</p>
          </ShadSidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1 flex flex-col overflow-y-auto">
           <header className="p-4 border-b border-border flex items-center sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <SidebarTrigger className="mr-4 md:hidden" /> {/* Only show on mobile */}
            <h2 className="text-lg font-headline font-semibold text-foreground">Editor Workspace</h2>
          </header>
          <main className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-y-auto">
            <VideoPreview videoSrc={currentVideo?.url} className="min-h-[300px] md:min-h-[400px]" />
            <TimelineEditor
              edl={currentEdl}
              videoDuration={currentVideo?.duration || 0}
              voiceoverScript={voiceoverData?.script}
              captionsData={captionsData}
              className="min-h-[300px] md:min-h-[400px]"
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
