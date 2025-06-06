"use client";

import { FC, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ffmpegManager, { loadFFmpegUtil } from '@/lib/ffmpeg';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import type { EditDecision } from '../modules/AiToolsModule';

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  videoData: { url: string; duration: number } | null;
  edl: EditDecision[] | null;
  userVoiceover: { url: string; duration: number } | null;
  captionsData: string | null;
}

const ExportModal: FC<ExportModalProps> = ({ isOpen, onOpenChange, videoData, edl, userVoiceover, captionsData }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const initializeFFmpeg = async () => {
    setLoadingError(null);
    const result = await ffmpegManager.loadFFmpeg();
    
    if (result.success) {
      setFfmpegLoaded(true);
    } else {
      setLoadingError(result.error || 'Failed to load video processor');
      toast({ 
        title: "Loading Error", 
        description: "Failed to load video processor. Please refresh the page and try again.", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    if (isOpen && !ffmpegLoaded && !loadingError) {
      initializeFFmpeg();
    }
  }, [isOpen, ffmpegLoaded, loadingError]);

  const handleExport = async () => {
    if (!videoData) {
      toast({ title: "Error", description: "No video data to export.", variant: "destructive" });
      return;
    }

    const ffmpeg = ffmpegManager.getFFmpeg();
    if (!ffmpeg) {
      toast({ title: "Exporter not ready", description: "The exporter is still loading, please try again in a moment.", variant: "destructive" });
      return;
    }
    
    setIsExporting(true);
    setProgress(0);
    toast({ title: "Export Started", description: "Your video is being processed." });

    try {
      const { fetchFile } = await loadFFmpegUtil();

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      
      await ffmpeg.writeFile('input.webm', await fetchFile(videoData.url));
      
      let command: string[];
      const hasCuts = edl?.some(e => e.action === 'cut');
      const hasOtherEdits = edl?.some(e => e.action === 'zoom' || e.action === 'highlight');

      if (hasOtherEdits) {
        toast({ title: "Heads Up", description: "Zoom and Highlight edits are not yet applied during export.", variant: "default" });
      }

      if (hasCuts) {
        if (userVoiceover || captionsData) {
           toast({ title: "Limitation", description: "Combining cuts with voiceovers or captions is not yet supported. Only cuts will be applied.", variant: "default" });
        }
        const cuts = edl!.filter(e => e.action === 'cut').sort((a, b) => a.startTime - b.startTime);
        const keepSegments = [];
        let lastEndTime = 0;

        for (const cut of cuts) {
          if (cut.startTime > lastEndTime) {
            keepSegments.push({ start: lastEndTime, end: cut.startTime });
          }
          lastEndTime = cut.endTime;
        }

        if (lastEndTime < videoData.duration) {
          keepSegments.push({ start: lastEndTime, end: videoData.duration });
        }

        const filterComplex = keepSegments.map((seg, i) => `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`).join('')
          + keepSegments.map((_, i) => `[v${i}][a${i}]`).join('')
          + `concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`;

        command = ['-i', 'input.webm', '-filter_complex', filterComplex, '-map', '[outv]', '-map', '[outa]', 'output.mp4'];

      } else {
        command = ['-i', 'input.webm'];
        if (userVoiceover) {
          await ffmpeg.writeFile('voiceover.wav', await fetchFile(userVoiceover.url));
          command.push('-i', 'voiceover.wav');
        }

        let filterComplexParts = [];
        if (captionsData) {
          await ffmpeg.writeFile('captions.srt', captionsData);
          filterComplexParts.push('subtitles=captions.srt');
        }
        
        if (filterComplexParts.length > 0) {
            command.push('-vf', filterComplexParts.join(','));
        }

        if (userVoiceover) {
          // Assumes main video has video and audio, and voiceover is second input
          command.push('-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy');
        }
        command.push('output.mp4');
      }

      await ffmpeg.exec(command);
      
      const data = await ffmpeg.readFile('output.mp4');
      const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'exported-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export Complete", description: "Your video has been downloaded." });

    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "Export Failed", description: "An error occurred during export.", variant: "destructive" });
    } finally {
      setIsExporting(false);
      setProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-popover border-border text-popover-foreground">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Export Options</DialogTitle>
          <DialogDescription>
            Choose your desired format, aspect ratio, and resolution for the final video.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {loadingError ? (
            <div className="flex flex-col items-center justify-center space-y-2 p-4 border border-destructive/20 rounded-lg">
              <span className="text-destructive">Failed to load video processor</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setLoadingError(null);
                  initializeFFmpeg();
                }}
              >
                Retry
              </Button>
            </div>
          ) : !ffmpegLoaded ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading video processor...</span>
            </div>
          ) : isExporting ? (
            <div className="space-y-2">
              <Label>Processing...</Label>
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="format" className="text-right col-span-1">
                  Format
                </Label>
                <Select defaultValue="mp4">
                  <SelectTrigger id="format" className="col-span-3 bg-input border-input ring-ring">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="mov">MOV</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="aspect-ratio" className="text-right col-span-1">
                  Aspect Ratio
                </Label>
                <Select defaultValue="16:9">
                  <SelectTrigger id="aspect-ratio" className="col-span-3 bg-input border-input ring-ring">
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resolution" className="text-right col-span-1">
                  Resolution
                </Label>
                <Select defaultValue="1080p">
                  <SelectTrigger id="resolution" className="col-span-3 bg-input border-input ring-ring">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="4k">4K (2160p)</SelectItem>
                    <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                    <SelectItem value="720p">HD (720p)</SelectItem>
                    <SelectItem value="480p">SD (480p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-muted-foreground border-muted-foreground/50 hover:bg-muted/20" disabled={isExporting}>Cancel</Button>
          <Button type="submit" onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isExporting || !ffmpegLoaded || loadingError !== null}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
