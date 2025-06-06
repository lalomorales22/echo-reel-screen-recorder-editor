"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ListVideo, Wand2, Voicemail, Type, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GenerateEditDecisionListOutput, EditDecisionListInput } from '@/ai/flows/generate-edit-decision-list';
import { generateEditDecisionList } from '@/ai/flows/generate-edit-decision-list';
import type { GenerateVoiceoverScriptOutput, GenerateVoiceoverScriptInput } from '@/ai/flows/generate-voiceover-script';
import { generateVoiceoverScript } from '@/ai/flows/generate-voiceover-script';
import type { GenerateCaptionsOutput, GenerateCaptionsInput } from '@/ai/flows/generate-captions';
import { generateCaptions } from '@/ai/flows/generate-captions';

interface AiToolsModuleProps {
  videoData: { url: string; duration: number } | null;
  onEdlGenerated: (edl: GenerateEditDecisionListOutput['edl']) => void;
  onVoiceoverGenerated: (script: string, voiceoverAudio?: string) => void;
  onCaptionsGenerated: (captions: string) => void;
}

// Mock Edit Decision type for internal use
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
}) => {
  const { toast } = useToast();
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [isLoadingEdl, setIsLoadingEdl] = useState(false);
  const [isLoadingVoiceoverScript, setIsLoadingVoiceoverScript] = useState(false);
  const [isLoadingVoiceoverAudio, setIsLoadingVoiceoverAudio] = useState(false);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);

  const handleGenerateEdl = async () => {
    if (!videoData) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingEdl(true);
    try {
      // In a real app, convert videoData.url (if it's a local blob/file) to a data URI.
      // For now, we'll mock this part as AI flows expect data URIs.
      const mockScreenRecordingDataUri = 'data:video/webm;base64,mocked_video_data_uri'; // Placeholder
      const input: EditDecisionListInput = { screenRecordingDataUri: mockScreenRecordingDataUri };
      
      // const result = await generateEditDecisionList(input);
      // For UI dev, mock the result:
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      const mockResult: GenerateEditDecisionListOutput = {
        edl: [
          { startTime: 5, endTime: 10, action: "cut", details: "Removed dead space" },
          { startTime: 15, endTime: 18, action: "zoom", details: "Zoomed on element X" },
          { startTime: 22, endTime: 24, action: "highlight", details: "Highlighted button Y" },
        ]
      };
      onEdlGenerated(mockResult.edl);
      toast({ title: "AI Edits Generated", description: "Review suggestions on the timeline." });
    } catch (error) {
      console.error("Error generating EDL:", error);
      toast({ title: "Error", description: "Could not generate AI edits.", variant: "destructive" });
    } finally {
      setIsLoadingEdl(false);
    }
  };

  const handleGenerateVoiceoverScript = async () => {
    if (!videoData) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingVoiceoverScript(true);
    try {
      const input: GenerateVoiceoverScriptInput = { videoContentDescription: "A screen recording showing a user interacting with a web application, clicking buttons and typing text." }; // Mock description
      // const result = await generateVoiceoverScript(input);
      // For UI dev, mock the result:
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResult: GenerateVoiceoverScriptOutput = { voiceoverScript: "First, click on the login button. Then, enter your credentials. Finally, navigate to the dashboard."};
      setVoiceoverScript(mockResult.voiceoverScript);
      toast({ title: "Voiceover Script Generated", description: "You can now generate audio." });
    } catch (error) {
      console.error("Error generating voiceover script:", error);
      toast({ title: "Error", description: "Could not generate voiceover script.", variant: "destructive" });
    } finally {
      setIsLoadingVoiceoverScript(false);
    }
  };

  const handleGenerateVoiceoverAudio = async () => {
    if (!voiceoverScript) {
      toast({ title: "No Script", description: "Please enter or generate a script first.", variant: "destructive" });
      return;
    }
    setIsLoadingVoiceoverAudio(true);
    try {
      // Mock TTS generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAudioUrl = "mock_voiceover_audio.mp3"; // Placeholder
      onVoiceoverGenerated(voiceoverScript, mockAudioUrl);
      toast({ title: "Voiceover Audio Generated", description: "Added to timeline." });
    } catch (error) {
      toast({ title: "Error", description: "Could not generate voiceover audio.", variant: "destructive" });
    } finally {
      setIsLoadingVoiceoverAudio(false);
    }
  };
  
  const handleGenerateCaptions = async () => {
    if (!videoData) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingCaptions(true);
    try {
      // Similar to EDL, mock data URI for audio.
      const mockAudioDataUri = 'data:audio/webm;base64,mocked_audio_data_uri'; // Placeholder
      const input: GenerateCaptionsInput = { audioDataUri: mockAudioDataUri };
      // const result = await generateCaptions(input);
      // For UI dev, mock the result:
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResult: GenerateCaptionsOutput = {
        captions: "1\n00:00:01,000 --> 00:00:03,000\nThis is the first caption.\n\n2\n00:00:04,000 --> 00:00:06,000\nThis is the second caption.\n"
      };
      onCaptionsGenerated(mockResult.captions);
      toast({ title: "Captions Generated", description: "Added to timeline." });
    } catch (error) {
      console.error("Error generating captions:", error);
      toast({ title: "Error", description: "Could not generate captions.", variant: "destructive" });
    } finally {
      setIsLoadingCaptions(false);
    }
  };


  return (
    <Card className="bg-card border-sidebar-border shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-lg text-sidebar-foreground">AI Editing Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGenerateEdl} className="w-full bg-primary hover:bg-primary/90" disabled={!videoData || isLoadingEdl}>
          {isLoadingEdl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListVideo className="mr-2 h-4 w-4 text-secondary" />}
          Generate Edit Suggestions
        </Button>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="voiceover" className="border-sidebar-border">
            <AccordionTrigger className="text-sidebar-foreground/90 hover:no-underline">
              <Voicemail className="mr-2 h-4 w-4 text-secondary" /> AI Voiceover
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <Textarea
                placeholder="Enter your voiceover script here..."
                value={voiceoverScript}
                onChange={(e) => setVoiceoverScript(e.target.value)}
                className="bg-input border-sidebar-border focus:ring-ring text-sidebar-foreground"
                rows={4}
              />
              <Button onClick={handleGenerateVoiceoverScript} variant="outline" className="w-full border-primary/50 text-primary-foreground/80" disabled={!videoData || isLoadingVoiceoverScript}>
                {isLoadingVoiceoverScript ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4 text-secondary" />}
                Generate Script from Video
              </Button>
              <Select defaultValue="alloy">
                <SelectTrigger className="w-full bg-input border-sidebar-border text-sidebar-foreground">
                  <SelectValue placeholder="Select AI Voice" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-sidebar-border text-popover-foreground">
                  <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                  <SelectItem value="echo">Echo (Energetic)</SelectItem>
                  <SelectItem value="fable">Fable (Storyteller)</SelectItem>
                  <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                  <SelectItem value="nova">Nova (Bright)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (Warm)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateVoiceoverAudio} className="w-full" variant="secondary" disabled={!voiceoverScript || isLoadingVoiceoverAudio}>
                 {isLoadingVoiceoverAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Voiceover Audio
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="captions" className="border-b-0 border-sidebar-border">
            <AccordionTrigger className="text-sidebar-foreground/90 hover:no-underline">
              <Type className="mr-2 h-4 w-4 text-secondary" /> AI Captioning
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <Button onClick={handleGenerateCaptions} className="w-full" variant="secondary" disabled={!videoData || isLoadingCaptions}>
                {isLoadingCaptions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate Captions
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AiToolsModule;

