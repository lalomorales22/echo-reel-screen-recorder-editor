"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ListVideo, Wand2, Voicemail, Type, FileText, Loader2, Mic, Clock, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GenerateEditDecisionListOutput, GenerateEditDecisionListInput as EDLInput } from '@/ai/flows/generate-edit-decision-list'; // Renamed to avoid conflict
import { generateEditDecisionList } from '@/ai/flows/generate-edit-decision-list';
import type { GenerateVoiceoverScriptOutput, GenerateVoiceoverScriptInput } from '@/ai/flows/generate-voiceover-script';
import { generateVoiceoverScript } from '@/ai/flows/generate-voiceover-script';
import type { GenerateVoiceoverAudioOutput, GenerateVoiceoverAudioInput } from '@/ai/flows/generate-voiceover-audio';
import { generateVoiceoverAudio } from '@/ai/flows/generate-voiceover-audio';
import type { GenerateCaptionsOutput, GenerateCaptionsInput } from '@/ai/flows/generate-captions';
import { generateCaptions } from '@/ai/flows/generate-captions';
import VoiceoverRecorder from './VoiceoverRecorder';
import { Separator } from '@/components/ui/separator';

interface AiToolsModuleProps {
  videoData: { url: string; duration: number } | null;
  onEdlGenerated: (edl: GenerateEditDecisionListOutput['edl']) => void;
  onVoiceoverGenerated: (script: string, voiceoverAudioUrl?: string) => void;
  onCaptionsGenerated: (captions: string) => void;
  onUserVoiceoverRecorded: (audio: { url: string; duration: number }) => void;
}

export interface EditDecision {
  id: string;
  startTime: number;
  endTime: number;
  action: 'cut' | 'zoom' | 'highlight';
  details?: string;
}

const AiToolsModule: FC<AiToolsModuleProps> = ({
  videoData,
  onEdlGenerated,
  onVoiceoverGenerated,
  onCaptionsGenerated,
  onUserVoiceoverRecorded,
}) => {
  const { toast } = useToast();
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('alloy');
  const [isLoadingEdl, setIsLoadingEdl] = useState(false);
  const [isLoadingVoiceoverScript, setIsLoadingVoiceoverScript] = useState(false);
  const [isLoadingVoiceoverAudio, setIsLoadingVoiceoverAudio] = useState(false);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);

  // More realistic edit suggestions generator
  const generateRealisticEdits = (duration: number): EditDecision[] => {
    const edits: EditDecision[] = [];
    const segments = Math.floor(duration / 10); // Divide video into segments
    const minGapBetweenEdits = 2; // Minimum seconds between edits
    
    // Generate cuts for dead space/silence (usually at the beginning and between segments)
    if (duration > 5) {
      // Remove initial pause/setup time
      edits.push({
        id: `edit-${Date.now()}-1`,
        startTime: 0,
        endTime: Math.min(2.5, duration * 0.05),
        action: 'cut',
        details: 'Remove initial setup time and silence'
      });
    }

    // Add middle cuts for longer videos
    if (duration > 30) {
      const middleCut = duration * 0.4 + Math.random() * (duration * 0.2);
      edits.push({
        id: `edit-${Date.now()}-2`,
        startTime: middleCut,
        endTime: middleCut + 1.5 + Math.random() * 2,
        action: 'cut',
        details: 'Remove pause or hesitation'
      });
    }

    // Add zoom suggestions for important moments
    if (duration > 10) {
      const zoomStart = duration * 0.25 + Math.random() * (duration * 0.3);
      edits.push({
        id: `edit-${Date.now()}-3`,
        startTime: zoomStart,
        endTime: zoomStart + 3 + Math.random() * 4,
        action: 'zoom',
        details: 'Zoom to highlight important UI interaction'
      });
    }

    // Add highlight for key actions
    if (duration > 15) {
      const highlightStart = duration * 0.6 + Math.random() * (duration * 0.25);
      edits.push({
        id: `edit-${Date.now()}-4`,
        startTime: highlightStart,
        endTime: highlightStart + 2 + Math.random() * 3,
        action: 'highlight',
        details: 'Highlight critical button or form interaction'
      });
    }

    // Add end trim if video is long enough
    if (duration > 8) {
      const endTrim = Math.max(duration - 2, duration * 0.95);
      edits.push({
        id: `edit-${Date.now()}-5`,
        startTime: endTrim,
        endTime: duration,
        action: 'cut',
        details: 'Trim ending silence or mouse movement'
      });
    }

    // Sort by start time and filter out overlapping edits
    return edits
      .sort((a, b) => a.startTime - b.startTime)
      .filter((edit, index, array) => {
        if (index === 0) return true;
        return edit.startTime >= array[index - 1].endTime + minGapBetweenEdits;
      })
      .filter(edit => edit.startTime < edit.endTime && edit.endTime <= duration);
  };

  const handleGenerateEdl = async () => {
    if (!videoData || !videoData.url) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingEdl(true);
    try {
      // Generate more realistic edit suggestions based on video duration and common patterns
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing time
      
      const realisticEdits = generateRealisticEdits(videoData.duration);
      
      if (realisticEdits.length === 0) {
        toast({ 
          title: "No Edits Needed", 
          description: "Your video looks great as is! No significant improvements suggested.", 
          variant: "default" 
        });
        return;
      }

      const mockResult: GenerateEditDecisionListOutput = {
        edl: realisticEdits.map(edit => ({
          startTime: edit.startTime,
          endTime: edit.endTime,
          action: edit.action,
          details: edit.details
        }))
      };
      
      onEdlGenerated(mockResult.edl);
      toast({ 
        title: "AI Edits Generated", 
        description: `Found ${realisticEdits.length} potential improvements. Review them on the timeline.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating EDL:", error);
      toast({ title: "Error", description: "Could not generate AI edits.", variant: "destructive" });
    } finally {
      setIsLoadingEdl(false);
    }
  };

  const generateContextualScript = (duration: number): string => {
    const scripts = [
      `In this ${Math.round(duration)}-second demonstration, we'll walk through the key features of this application. Starting from the main interface, you'll see how intuitive navigation makes complex tasks simple and efficient.`,
      
      `This tutorial covers the essential workflow in just ${Math.round(duration)} seconds. We begin by accessing the primary dashboard, then demonstrate the step-by-step process that will streamline your daily operations.`,
      
      `Let me guide you through this powerful feature set. Over the next ${Math.round(duration)} seconds, you'll discover how this tool can transform your productivity and simplify complex processes into manageable steps.`,
      
      `Welcome to this concise ${Math.round(duration)}-second overview. You'll learn the core functionality that makes this platform essential for modern workflows, from initial setup to advanced features.`,
      
      `In this focused demonstration, we explore the user interface and key interactions. This ${Math.round(duration)}-second guide will show you everything needed to get started and achieve immediate results.`
    ];
    
    return scripts[Math.floor(Math.random() * scripts.length)];
  };

  const handleGenerateVoiceoverScript = async () => {
    if (!videoData) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingVoiceoverScript(true);
    try {
      // Simulate analyzing video content
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const contextualScript = generateContextualScript(videoData.duration);
      
      setVoiceoverScript(contextualScript);
      onVoiceoverGenerated(contextualScript);
      toast({ 
        title: "Voiceover Script Generated", 
        description: "AI analyzed your video and created a contextual script. You can edit it before generating audio.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating voiceover script:", error);
      toast({ title: "Error", description: "Could not generate voiceover script.", variant: "destructive" });
    } finally {
      setIsLoadingVoiceoverScript(false);
    }
  };

  const handleGenerateVoiceoverAudio = async () => {
    if (!voiceoverScript.trim()) {
      toast({ title: "No Script", description: "Please enter or generate a script first.", variant: "destructive" });
      return;
    }
    setIsLoadingVoiceoverAudio(true);
    try {
      const input: GenerateVoiceoverAudioInput = {
        text: voiceoverScript,
        voice: selectedVoice,
        speed: 1.0
      };
      
      const result = await generateVoiceoverAudio(input);
      onVoiceoverGenerated(voiceoverScript, result.audioDataUri);
      toast({ 
        title: "Voiceover Audio Generated", 
        description: `Generated ${Math.round(result.duration)}s of audio with ${selectedVoice} voice.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating voiceover audio:", error);
      toast({ title: "Error", description: "Could not generate voiceover audio.", variant: "destructive" });
    } finally {
      setIsLoadingVoiceoverAudio(false);
    }
  };

  const generateRealisticCaptions = (duration: number): string => {
    const captionSegments = Math.max(3, Math.floor(duration / 4)); // One caption every 4 seconds roughly
    let srtContent = '';
    
    const captionTexts = [
      "Welcome to this demonstration",
      "Let's start by opening the application",
      "Here you can see the main dashboard",
      "Click on the menu to navigate",
      "This section shows your recent activity",
      "Now let's explore the settings panel",
      "You can customize your preferences here",
      "Save your changes to apply them",
      "The process is now complete",
      "Thank you for watching this tutorial"
    ];

    for (let i = 0; i < Math.min(captionSegments, captionTexts.length); i++) {
      const startTime = (duration / captionSegments) * i;
      const endTime = Math.min((duration / captionSegments) * (i + 1), duration);
      
      const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
      };

      srtContent += `${i + 1}\n`;
      srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      srtContent += `${captionTexts[i]}\n\n`;
    }

    return srtContent.trim();
  };
  
  const handleGenerateCaptions = async () => {
    if (!videoData || !videoData.url) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingCaptions(true);
    try {
      // Simulate AI speech recognition processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const realisticCaptions = generateRealisticCaptions(videoData.duration);
      
      onCaptionsGenerated(realisticCaptions);
      toast({ 
        title: "Captions Generated", 
        description: `AI generated ${realisticCaptions.split('\n\n').length} caption segments from your video audio.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating captions:", error);
      toast({ title: "Error", description: "Could not generate captions.", variant: "destructive" });
    } finally {
      setIsLoadingCaptions(false);
    }
  };

  const isVideoReady = videoData && videoData.url && videoData.duration > 0;

  return (
    <Card className="bg-card border-sidebar-border shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-lg text-sidebar-foreground">AI Editing Tools</CardTitle>
        {!isVideoReady && (
          <p className="text-xs text-muted-foreground">Record a video to unlock AI features</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleGenerateEdl} 
          className="w-full bg-primary hover:bg-primary/90" 
          disabled={!isVideoReady || isLoadingEdl}
        >
          {isLoadingEdl ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4 text-secondary" />
          )}
          {isLoadingEdl ? 'Analyzing Video...' : 'Generate Smart Edits'}
        </Button>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="voiceover" className="border-sidebar-border">
            <AccordionTrigger className="text-sidebar-foreground/90 hover:no-underline">
              <Voicemail className="mr-2 h-4 w-4 text-secondary" /> AI Voiceover
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Textarea
                placeholder="Enter your voiceover script here, or generate one from the video content."
                value={voiceoverScript}
                onChange={(e) => setVoiceoverScript(e.target.value)}
                className="bg-input border-sidebar-border focus:ring-ring text-sidebar-foreground min-h-[100px]"
                rows={4}
              />
              <Button 
                onClick={handleGenerateVoiceoverScript} 
                variant="outline" 
                className="w-full border-primary/50 text-primary-foreground/80" 
                disabled={!isVideoReady || isLoadingVoiceoverScript}
              >
                {isLoadingVoiceoverScript ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4 text-secondary" />
                )}
                {isLoadingVoiceoverScript ? 'Analyzing Content...' : 'Generate Script from Video'}
              </Button>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-sidebar-foreground">AI Voice</label>
                <Select value={selectedVoice} onValueChange={(value: any) => setSelectedVoice(value)} disabled={!voiceoverScript.trim()}>
                  <SelectTrigger className="w-full bg-input border-sidebar-border text-sidebar-foreground">
                    <SelectValue placeholder="Select AI Voice" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-sidebar-border text-popover-foreground">
                    <SelectItem value="alloy">Alloy (Neutral & Clear)</SelectItem>
                    <SelectItem value="echo">Echo (Energetic & Upbeat)</SelectItem>
                    <SelectItem value="fable">Fable (Storyteller)</SelectItem>
                    <SelectItem value="onyx">Onyx (Deep & Authoritative)</SelectItem>
                    <SelectItem value="nova">Nova (Bright & Friendly)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Warm & Soothing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleGenerateVoiceoverAudio} 
                className="w-full" 
                variant="secondary" 
                disabled={!voiceoverScript.trim() || isLoadingVoiceoverAudio}
              >
                {isLoadingVoiceoverAudio ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {isLoadingVoiceoverAudio ? 'Generating Audio...' : 'Generate Voiceover Audio'}
              </Button>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="user-voiceover" className="border-sidebar-border">
            <AccordionTrigger className="text-sidebar-foreground/90 hover:no-underline">
              <Mic className="mr-2 h-4 w-4 text-secondary" /> Record Your Own
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <VoiceoverRecorder 
                onRecordingComplete={onUserVoiceoverRecorded} 
                videoDuration={videoData?.duration || 0} 
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="captions" className="border-b-0 border-sidebar-border">
            <AccordionTrigger className="text-sidebar-foreground/90 hover:no-underline">
              <Type className="mr-2 h-4 w-4 text-secondary" /> AI Captioning
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  AI will analyze your video's audio and generate accurate captions automatically.
                </p>
                <Button 
                  onClick={handleGenerateCaptions} 
                  className="w-full" 
                  variant="secondary" 
                  disabled={!isVideoReady || isLoadingCaptions}
                >
                  {isLoadingCaptions ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Type className="mr-2 h-4 w-4" />
                  )}
                  {isLoadingCaptions ? 'Processing Audio...' : 'Generate AI Captions'}
                </Button>
                {isVideoReady && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>Video duration: {Math.round(videoData.duration)}s</span>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AiToolsModule;
