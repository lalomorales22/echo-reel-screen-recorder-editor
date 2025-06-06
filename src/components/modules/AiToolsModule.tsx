
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
import type { GenerateEditDecisionListOutput, GenerateEditDecisionListInput as EDLInput } from '@/ai/flows/generate-edit-decision-list'; // Renamed to avoid conflict
import { generateEditDecisionList } from '@/ai/flows/generate-edit-decision-list';
import type { GenerateVoiceoverScriptOutput, GenerateVoiceoverScriptInput } from '@/ai/flows/generate-voiceover-script';
import { generateVoiceoverScript } from '@/ai/flows/generate-voiceover-script';
import type { GenerateCaptionsOutput, GenerateCaptionsInput } from '@/ai/flows/generate-captions';
import { generateCaptions } from '@/ai/flows/generate-captions';

interface AiToolsModuleProps {
  videoData: { url: string; duration: number } | null;
  onEdlGenerated: (edl: GenerateEditDecisionListOutput['edl']) => void;
  onVoiceoverGenerated: (script: string, voiceoverAudioUrl?: string) => void;
  onCaptionsGenerated: (captions: string) => void;
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
}) => {
  const { toast } = useToast();
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [isLoadingEdl, setIsLoadingEdl] = useState(false);
  const [isLoadingVoiceoverScript, setIsLoadingVoiceoverScript] = useState(false);
  const [isLoadingVoiceoverAudio, setIsLoadingVoiceoverAudio] = useState(false);
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);

  const handleGenerateEdl = async () => {
    if (!videoData || !videoData.url) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingEdl(true);
    try {
      // In a real app, you might need to fetch the blob and convert to data URI if Genkit doesn't handle blob URLs
      // For now, assuming Genkit flows can handle blob URLs or this is handled internally.
      // If Genkit strictly needs data URIs, this part would need blob-to-dataURI conversion.
      const input: EDLInput = { screenRecordingDataUri: videoData.url }; // Pass the actual video URL
      
      // const result = await generateEditDecisionList(input);
      // Mocking result for UI dev:
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      const mockResult: GenerateEditDecisionListOutput = {
        edl: [
          { startTime: videoData.duration * 0.1, endTime: videoData.duration * 0.2, action: "cut", details: "Removed dead space" },
          { startTime: videoData.duration * 0.3, endTime: videoData.duration * 0.4, action: "zoom", details: "Zoomed on element X" },
          { startTime: videoData.duration * 0.5, endTime: videoData.duration * 0.6, action: "highlight", details: "Highlighted button Y" },
        ].filter(edit => edit.endTime <= videoData.duration) // Ensure mock edits are within video duration
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
      const input: GenerateVoiceoverScriptInput = { videoContentDescription: "A screen recording of a user interacting with a web application. Key actions include clicking buttons, typing text into forms, and navigating through different pages." }; 
      // const result = await generateVoiceoverScript(input);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResult: GenerateVoiceoverScriptOutput = { voiceoverScript: "User starts by landing on the homepage. First, they click on the login button located at the top right. Then, they proceed to enter their username and password into the respective fields. After successful login, they navigate to the main dashboard to view their account summary."};
      setVoiceoverScript(mockResult.voiceoverScript);
      onVoiceoverGenerated(mockResult.voiceoverScript); // Pass script to parent
      toast({ title: "Voiceover Script Generated", description: "You can now (optionally) generate audio." });
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
      // This would be a call to a Text-to-Speech AI flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAudioUrl = "data:audio/mp3;base64,SUQzBAAAAAAB..."; // Placeholder Data URI for mock audio
      onVoiceoverGenerated(voiceoverScript, mockAudioUrl); // Update parent with audio URL
      toast({ title: "Voiceover Audio Generated", description: "Voiceover audio (mock) is ready." });
    } catch (error) {
      toast({ title: "Error", description: "Could not generate voiceover audio.", variant: "destructive" });
    } finally {
      setIsLoadingVoiceoverAudio(false);
    }
  };
  
  const handleGenerateCaptions = async () => {
    if (!videoData || !videoData.url) {
      toast({ title: "No Video", description: "Please record or upload a video first.", variant: "destructive" });
      return;
    }
    setIsLoadingCaptions(true);
    try {
      // Assuming Genkit flow can handle blob URL directly or it's converted.
      // For audio extraction from video, a more complex setup or a specific Genkit tool would be needed.
      // Here, we'll assume `videoData.url` can be used or a separate audio track is available.
      // For this example, we use a mock based on videoData.url.
      const input: GenerateCaptionsInput = { audioDataUri: videoData.url }; // This implies the flow can extract audio or it's an audio file.
      
      // const result = await generateCaptions(input);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const d = videoData.duration;
      const mockCaptionsSRT = `1
00:00:${String(Math.floor(d * 0.1)).padStart(2, '0')},000 --> 00:00:${String(Math.floor(d * 0.2)).padStart(2, '0')},000
This is the first mock caption.

2
00:00:${String(Math.floor(d * 0.25)).padStart(2, '0')},000 --> 00:00:${String(Math.floor(d * 0.35)).padStart(2, '0')},000
And here comes a second one.

3
00:00:${String(Math.floor(d * 0.4)).padStart(2, '0')},000 --> 00:00:${String(Math.floor(d * 0.5)).padStart(2, '0')},000
Talking about what's happening on screen.

4
00:00:${String(Math.floor(d * 0.6)).padStart(2, '0')},000 --> 00:00:${String(Math.floor(d * 0.7)).padStart(2, '0')},000
Almost near the end of this segment.
`;
      const mockResult: GenerateCaptionsOutput = {
        captions: d > 0 ? mockCaptionsSRT : "1\n00:00:01,000 --> 00:00:03,000\nNo video duration for dynamic captions.\n"
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
                placeholder="Enter your voiceover script here, or generate one from the video content."
                value={voiceoverScript}
                onChange={(e) => setVoiceoverScript(e.target.value)}
                className="bg-input border-sidebar-border focus:ring-ring text-sidebar-foreground"
                rows={4}
              />
              <Button onClick={handleGenerateVoiceoverScript} variant="outline" className="w-full border-primary/50 text-primary-foreground/80" disabled={!videoData || isLoadingVoiceoverScript}>
                {isLoadingVoiceoverScript ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4 text-secondary" />}
                Generate Script from Video
              </Button>
              <Select defaultValue="alloy" disabled={!voiceoverScript}>
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
                Generate Voiceover Audio (Mock)
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
