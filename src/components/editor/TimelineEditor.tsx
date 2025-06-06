
"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, ZoomIn, ZoomOut, Scissors, Film, AudioWaveform, CaptionsIcon } from 'lucide-react';
import type { EditDecision } from '@/components/modules/AiToolsModule';
import TimelineTrack from './TimelineTrack';
import EditSegment from './EditSegment';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

interface TimelineEditorProps {
  edl: EditDecision[] | null;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  voiceoverScript?: string;
  voiceoverAudioUrl?: string; // For future use or display
  captionsData?: string;
  className?: string;
}

const TimelineEditor: FC<TimelineEditorProps> = ({
  edl,
  videoDuration,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  voiceoverScript,
  voiceoverAudioUrl,
  captionsData,
  className,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%

  const trackWidth = useMemo(() => Math.max(videoDuration * 10 * zoomLevel, 300), [videoDuration, zoomLevel]);

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel * 1.25, 5));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel / 1.25, 0.25));

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return isNaN(seconds) ? "00:00:00" : `${h}:${m}:${s}`;
  };

  const parsedCaptions = useMemo(() => {
    if (!captionsData) return [];
    return captionsData.split('\n\n').map((block, index) => {
      const lines = block.split('\n');
      if (lines.length < 2) return null; // Allow captions with no text for timing
      const timeMatch = lines.find(line => line.includes('-->'))?.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3}) --> (\d{2}:\d{2}:\d{2}[,.]\d{3})/);
      if (!timeMatch) return null;
      
      const timeToSeconds = (ts: string) => {
        const [hms, msPart] = ts.split(/[,.]/);
        const [h, m, s] = hms.split(':');
        return parseInt(h)*3600 + parseInt(m)*60 + parseInt(s) + parseInt(msPart)/1000;
      };
      const textLines = lines.slice(lines.findIndex(line => line.includes('-->')) + 1);
      return {
        id: `caption-${index}`,
        startTime: timeToSeconds(timeMatch[1]),
        endTime: timeToSeconds(timeMatch[2]),
        text: textLines.join(' ').trim(),
      };
    }).filter(c => c !== null && c.startTime < c.endTime && c.startTime >=0 && c.endTime >=0);
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
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="primary" size="icon" onClick={onPlayPause} className="bg-primary text-primary-foreground">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <div className="text-sm font-mono text-muted-foreground tabular-nums w-20">{formatTime(currentTime)}</div>
          <Slider
            value={[currentTime]}
            max={videoDuration || 0}
            step={0.1}
            onValueChange={(value) => onSeek(value[0])}
            className="flex-grow"
            disabled={!videoDuration}
          />
          <div className="text-sm font-mono text-muted-foreground tabular-nums w-20">{formatTime(videoDuration)}</div>
        </div>

        <ScrollArea className="flex-grow relative w-full" style={{ minHeight: '200px' }}>
          <div className="space-y-1 pr-4" style={{ width: `${trackWidth}px`, minHeight: '100%'}}>
             <TimelineTrack title="Video" icon={<Film className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
              {videoDuration > 0 && (
                <div className="absolute top-0 left-0 h-full bg-primary/30" style={{width: '100%'}}>
                  <span className="absolute top-1 left-2 text-xs text-primary-foreground/70">Main Video</span>
                </div>
              )}
            </TimelineTrack>

            <TimelineTrack title="AI Edits" icon={<Scissors className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
              {edl?.map((edit) => (
                <EditSegment
                  key={edit.id}
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
                  <span className="absolute top-1 left-2 text-xs text-accent-foreground/90 truncate max-w-[95%] px-1">
                    {voiceoverScript.substring(0,100)}{voiceoverScript.length > 100 ? '...' : ''}
                    {voiceoverAudioUrl && <span className="text-xs opacity-70 ml-2">(Audio available)</span>}
                  </span>
                </div>
              </TimelineTrack>
            )}

            {captionsData && parsedCaptions.length > 0 && (
              <TimelineTrack title="Captions" icon={<CaptionsIcon className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel}>
                {parsedCaptions.map(caption => caption && (
                   <div
                    key={caption.id}
                    className="absolute h-full bg-secondary/40 hover:bg-secondary/60 cursor-pointer overflow-hidden group border-l border-r border-secondary/80"
                    style={{
                      left: `${(caption.startTime / videoDuration) * 100}%`,
                      width: `${Math.max(((caption.endTime - caption.startTime) / videoDuration) * 100, 0.1)}%`,
                      minWidth: '2px'
                    }}
                    title={caption.text}
                  >
                    <span className="absolute top-0 left-0 right-0 bottom-0 p-1 text-[10px] leading-tight text-secondary-foreground whitespace-normal overflow-hidden text-ellipsis">
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
