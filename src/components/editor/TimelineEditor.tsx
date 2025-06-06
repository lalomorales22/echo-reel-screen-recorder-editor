"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, ZoomIn, ZoomOut, Scissors, Film, AudioWaveform, CaptionsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EditDecision } from '@/components/modules/AiToolsModule'; // Re-using type
import TimelineTrack from './TimelineTrack';
import EditSegment from './EditSegment';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface TimelineEditorProps {
  edl: EditDecision[] | null;
  voiceoverScript?: string; // or audio data
  captionsData?: string; // SRT or structured
  videoDuration: number; // in seconds
  className?: string;
}

const TimelineEditor: FC<TimelineEditorProps> = ({
  edl,
  voiceoverScript,
  captionsData,
  videoDuration,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%

  const trackWidth = useMemo(() => videoDuration * 10 * zoomLevel, [videoDuration, zoomLevel]); // 10px per second at 100% zoom

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel * 1.25, 5));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel / 1.25, 0.25));

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Mock caption segments from SRT
  const parsedCaptions = useMemo(() => {
    if (!captionsData) return [];
    // Basic SRT parser (simplified for mock)
    return captionsData.split('\n\n').map((block, index) => {
      const lines = block.split('\n');
      if (lines.length < 3) return null;
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) return null;
      const timeToSeconds = (ts: string) => {
        const [h, m, s_ms] = ts.split(':');
        const [s, ms] = s_ms.split(',');
        return parseInt(h)*3600 + parseInt(m)*60 + parseInt(s) + parseInt(ms)/1000;
      }
      return {
        id: `caption-${index}`,
        startTime: timeToSeconds(timeMatch[1]),
        endTime: timeToSeconds(timeMatch[2]),
        text: lines.slice(2).join(' '),
      };
    }).filter(c => c !== null);
  }, [captionsData]);

  return (
    <Card className={`bg-card border-border shadow-xl flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
        <CardTitle className="font-headline text-lg text-card-foreground">Timeline Editor</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-muted-foreground hover:text-foreground">
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-muted-foreground hover:text-foreground">
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col overflow-hidden">
        {/* Playback Controls */}
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="primary" size="icon" onClick={handlePlayPause} className="bg-primary text-primary-foreground">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <div className="text-sm font-mono text-muted-foreground tabular-nums w-20">{formatTime(currentTime)}</div>
          <Slider
            defaultValue={[0]}
            max={videoDuration}
            step={0.1}
            value={[currentTime]}
            onValueChange={(value) => setCurrentTime(value[0])}
            className="flex-grow"
          />
          <div className="text-sm font-mono text-muted-foreground tabular-nums w-20">{formatTime(videoDuration)}</div>
        </div>

        {/* Timeline Tracks */}
        <ScrollArea className="flex-grow relative w-full" style={{ minHeight: '200px' }}>
          <div className="space-y-1 pr-4" style={{ width: `${Math.max(trackWidth,300)}px`, minHeight: '100%'}}>
             <TimelineTrack title="Video" icon={<Film className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
              {/* Mock video segment */}
              <div className="absolute top-0 left-0 h-full bg-primary/30" style={{width: '100%'}}>
                <span className="absolute top-1 left-2 text-xs text-primary-foreground/70">Main Video</span>
              </div>
            </TimelineTrack>

            <TimelineTrack title="AI Edits" icon={<Scissors className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
              {edl?.map((edit, index) => (
                <EditSegment
                  key={edit.id || `edit-${index}`}
                  edit={edit}
                  videoDuration={videoDuration}
                  zoomLevel={zoomLevel}
                  onAccept={() => console.log('Accepted:', edit)}
                  onReject={() => console.log('Rejected:', edit)}
                  onModify={() => console.log('Modify:', edit)}
                />
              ))}
            </TimelineTrack>
            
            {voiceoverScript && (
              <TimelineTrack title="Voiceover" icon={<AudioWaveform className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
                <div className="absolute top-0 left-0 h-full bg-accent/30" style={{width: '100%'}}>
                  <span className="absolute top-1 left-2 text-xs text-accent-foreground/70 truncate max-w-[95%]">
                    {voiceoverScript.substring(0,50)}{voiceoverScript.length > 50 ? '...' : ''}
                  </span>
                </div>
              </TimelineTrack>
            )}

            {captionsData && (
              <TimelineTrack title="Captions" icon={<CaptionsIcon className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
                {parsedCaptions.map(caption => caption && (
                   <div
                    key={caption.id}
                    className="absolute h-full bg-secondary/30 hover:bg-secondary/50 cursor-pointer overflow-hidden group"
                    style={{
                      left: `${(caption.startTime / videoDuration) * 100}%`,
                      width: `${((caption.endTime - caption.startTime) / videoDuration) * 100}%`,
                      minWidth: '10px'
                    }}
                    title={caption.text}
                  >
                    <span className="absolute top-1 left-1 text-xs text-secondary-foreground truncate pr-1 group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-secondary/80 group-hover:p-1 group-hover:rounded group-hover:z-10">
                      {caption.text}
                    </span>
                  </div>
                ))}
              </TimelineTrack>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TimelineEditor;
