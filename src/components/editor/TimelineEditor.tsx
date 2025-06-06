"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, ZoomIn, ZoomOut, Scissors, Film, AudioWaveform, CaptionsIcon, Mic, Camera } from 'lucide-react';
import type { EditDecision } from '@/components/modules/AiToolsModule';
import type { CaptionTrack } from '@/components/editor/CaptionEditor';
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
  onDeleteEdit?: (id: string) => void;
  onUpdateEdit?: (id: string, updates: Partial<EditDecision>) => void;
  voiceoverScript?: string;
  voiceoverAudioUrl?: string;
  userVoiceoverUrl?: string;
  captionsData?: string | null; // Legacy SRT data
  captionTracks?: CaptionTrack[]; // New caption tracks
  webcamVideoUrl?: string | null; // Webcam video URL
  className?: string;
}

const TimelineEditor: FC<TimelineEditorProps> = ({
  edl,
  videoDuration,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  onDeleteEdit,
  onUpdateEdit,
  voiceoverScript,
  voiceoverAudioUrl,
  userVoiceoverUrl,
  captionsData,
  captionTracks = [],
  webcamVideoUrl,
  className,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Improved responsive track width calculation
  const trackWidth = useMemo(() => {
    const baseWidth = Math.max(videoDuration * 50, 800); // Increased base multiplier
    const scaledWidth = baseWidth * zoomLevel;
    const minWidth = 600; // Minimum width for usability
    const maxWidth = 5000; // Maximum to prevent excessive scrolling
    return Math.min(Math.max(scaledWidth, minWidth), maxWidth);
  }, [videoDuration, zoomLevel]);

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel * 1.25, 5));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel / 1.25, 0.25));

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return isNaN(seconds) ? "00:00:00" : `${h}:${m}:${s}`;
  };

  // Parse legacy SRT captions for backward compatibility
  const parsedLegacyCaptions = useMemo(() => {
    if (!captionsData) return [];
    return captionsData.split('\n\n').map((block, index) => {
      const lines = block.split('\n');
      if (lines.length < 2) return null;
      const timeMatch = lines.find(line => line.includes('-->'))?.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3}) --> (\d{2}:\d{2}:\d{2}[,.]\d{3})/);
      if (!timeMatch) return null;
      
      const timeToSeconds = (ts: string) => {
        const [hms, msPart] = ts.split(/[,.]/);
        const [h, m, s] = hms.split(':');
        return parseInt(h)*3600 + parseInt(m)*60 + parseInt(s) + parseInt(msPart)/1000;
      };
      const textLines = lines.slice(lines.findIndex(line => line.includes('-->')) + 1);
      return {
        id: `legacy-caption-${index}`,
        startTime: timeToSeconds(timeMatch[1]),
        endTime: timeToSeconds(timeMatch[2]),
        text: textLines.join(' ').trim(),
      };
    }).filter(c => c !== null && c.startTime < c.endTime && c.startTime >=0 && c.endTime >=0);
  }, [captionsData]);

  // Get all captions from new caption tracks
  const allCaptionsFromTracks = useMemo(() => {
    const allCaptions: Array<{id: string, startTime: number, endTime: number, text: string, trackName: string}> = [];
    
    captionTracks.forEach(track => {
      if (track.isVisible) {
        track.captions.forEach(caption => {
          allCaptions.push({
            id: caption.id,
            startTime: caption.startTime,
            endTime: caption.endTime,
            text: caption.text,
            trackName: track.name
          });
        });
      }
    });
    
    return allCaptions;
  }, [captionTracks]);

  // Combine legacy and new captions
  const allCaptions = useMemo(() => {
    return [...parsedLegacyCaptions, ...allCaptionsFromTracks];
  }, [parsedLegacyCaptions, allCaptionsFromTracks]);

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
          <Button variant="default" size="icon" onClick={onPlayPause}>
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
            {/* Video Track */}
            <TimelineTrack title="Video" icon={<Film className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel} trackWidth={trackWidth}>
              {videoDuration > 0 && (
                <div className="absolute top-0 left-0 h-full bg-primary/30" style={{width: '100%'}}>
                  <span className="absolute top-1 left-2 text-xs text-primary-foreground/70">Main Video</span>
                </div>
              )}
            </TimelineTrack>

            {/* Webcam Track */}
            {webcamVideoUrl && (
              <TimelineTrack title="Webcam" icon={<Camera className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel} trackWidth={trackWidth}>
                {videoDuration > 0 && (
                  <div className="absolute top-0 left-0 h-full bg-blue-500/30" style={{width: '100%'}}>
                    <span className="absolute top-1 left-2 text-xs text-blue-100/70">Webcam Recording</span>
                  </div>
                )}
              </TimelineTrack>
            )}

            {/* AI Edits Track */}
            <TimelineTrack title="AI Edits" icon={<Scissors className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel} trackWidth={trackWidth}>
              {videoDuration > 0 && (
                <div className="absolute top-0 left-0 h-full bg-muted/20" style={{width: '100%'}}>
                  <span className="absolute top-1 left-2 text-xs text-muted-foreground/70">
                    {edl && edl.length > 0 ? `${edl.length} suggestion${edl.length !== 1 ? 's' : ''}` : 'No edits'}
                  </span>
                </div>
              )}
              {edl?.map((edit) => (
                <EditSegment
                  key={edit.id}
                  edit={edit}
                  videoDuration={videoDuration}
                  trackWidth={trackWidth}
                  zoomLevel={zoomLevel}
                  onAccept={() => {
                    console.log('Accepted:', edit.id);
                    // Could add visual feedback here
                  }}
                  onReject={onDeleteEdit}
                  onModify={(updates) => onUpdateEdit?.(edit.id, updates)}
                />
              ))}
            </TimelineTrack>
            
            {/* AI Voiceover Track */}
            {voiceoverScript && (
              <TimelineTrack title="AI Voiceover" icon={<AudioWaveform className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel} trackWidth={trackWidth}>
                <div className="absolute top-0 left-0 h-full bg-accent/30" style={{width: '100%'}}>
                  <span className="absolute top-1 left-2 text-xs text-accent-foreground/90 truncate max-w-[95%] px-1">
                    {voiceoverScript.substring(0,100)}{voiceoverScript.length > 100 ? '...' : ''}
                    {voiceoverAudioUrl && <span className="text-xs opacity-70 ml-2">(Audio available)</span>}
                  </span>
                </div>
              </TimelineTrack>
            )}

            {/* User Voiceover Track */}
            {userVoiceoverUrl && (
              <TimelineTrack title="User Voiceover" icon={<Mic className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel} trackWidth={trackWidth}>
                <div className="absolute top-0 left-0 h-full bg-blue-500/30" style={{width: '100%'}}>
                  <span className="absolute top-1 left-2 text-xs text-blue-100/90 truncate max-w-[95%] px-1">
                    Your recorded voiceover
                  </span>
                </div>
              </TimelineTrack>
            )}

            {/* Caption Tracks - Show individual tracks */}
            {captionTracks.map(track => track.isVisible && (
              <TimelineTrack 
                key={track.id} 
                title={`${track.name} (${track.language})`} 
                icon={<CaptionsIcon className="text-secondary" />} 
                duration={videoDuration} 
                zoomLevel={zoomLevel}
                trackWidth={trackWidth}
              >
                {/* Background bar for the track */}
                {videoDuration > 0 && (
                  <div className="absolute top-0 left-0 h-full bg-secondary/20" style={{width: '100%'}}>
                    <span className="absolute top-1 left-2 text-xs text-secondary-foreground/70">
                      {track.captions.length} caption{track.captions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {/* Individual caption segments */}
                {track.captions.map(caption => (
                  <div
                    key={caption.id}
                    className="absolute h-full bg-secondary/60 hover:bg-secondary/80 cursor-pointer overflow-hidden group border-l border-r border-secondary/80"
                    style={{
                      left: `${(caption.startTime / videoDuration) * 100}%`,
                      width: `${Math.max(((caption.endTime - caption.startTime) / videoDuration) * 100, 0.5)}%`,
                      minWidth: '2px'
                    }}
                    title={`${caption.text} (${caption.startTime.toFixed(1)}s - ${caption.endTime.toFixed(1)}s)`}
                  >
                    <span className="absolute top-0 left-0 right-0 bottom-0 p-1 text-[10px] leading-tight text-secondary-foreground whitespace-normal overflow-hidden text-ellipsis">
                      {caption.text}
                    </span>
                  </div>
                ))}
              </TimelineTrack>
            ))}

            {/* Legacy Captions Track - for backward compatibility */}
            {captionsData && parsedLegacyCaptions.length > 0 && (
              <TimelineTrack title="Legacy Captions" icon={<CaptionsIcon className="text-secondary" />} duration={videoDuration} zoomLevel={zoomLevel} trackWidth={trackWidth}>
                {videoDuration > 0 && (
                  <div className="absolute top-0 left-0 h-full bg-secondary/20" style={{width: '100%'}}>
                    <span className="absolute top-1 left-2 text-xs text-secondary-foreground/70">AI Generated</span>
                  </div>
                )}
                {parsedLegacyCaptions.map(caption => caption && (
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
