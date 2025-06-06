"use client";

import { FC, RefObject, useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, Monitor, Camera, PictureInPicture } from 'lucide-react';
import type { CaptionTrack, CaptionItem } from '@/components/editor/CaptionEditor';

interface EnhancedVideoPreviewProps {
  videoSrc?: string | null;
  webcamSrc?: string | null;
  videoRef: RefObject<HTMLVideoElement>;
  webcamVideoRef?: RefObject<HTMLVideoElement>;
  voiceoverSrc?: string | null;
  audioRef?: RefObject<HTMLAudioElement>;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
  subtitlesSrc?: string | null;
  captionTracks?: CaptionTrack[];
  currentTime: number;
  className?: string;
}

const EnhancedVideoPreview: FC<EnhancedVideoPreviewProps> = ({ 
  videoSrc, 
  webcamSrc,
  videoRef,
  webcamVideoRef,
  voiceoverSrc,
  audioRef,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  subtitlesSrc,
  captionTracks = [],
  currentTime,
  className 
}) => {
  const [viewMode, setViewMode] = useState<'screen' | 'webcam' | 'pip'>('screen');
  const [webcamPosition, setWebcamPosition] = useState({ x: 20, y: 20 }); // Position in pixels from edges
  const [webcamSize, setWebcamSize] = useState({ width: 240, height: 180 }); // Size in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const isActualVideo = videoSrc && (videoSrc.startsWith('blob:') || videoSrc.startsWith('data:video'));
  const isActualWebcam = webcamSrc && (webcamSrc.startsWith('blob:') || webcamSrc.startsWith('data:video'));
  const hasMultipleVideos = isActualVideo && isActualWebcam;
  
  // Determine which video should control timeline (always prioritize screen, then webcam)
  const activeVideoRef = viewMode === 'webcam' && !isActualVideo ? webcamVideoRef : videoRef;
  const activeVideoSrc = viewMode === 'webcam' && !isActualVideo ? webcamSrc : videoSrc;
  
  // Handle webcam drag start
  const handleWebcamMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'pip') return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - webcamPosition.x,
      y: e.clientY - webcamPosition.y
    });
  };

  // Handle webcam resize start
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'pip') return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move for drag and resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - webcamSize.width - 40));
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - webcamSize.height - 40));
        setWebcamPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        const newWidth = Math.max(160, Math.min(webcamSize.width + deltaX, 400));
        const newHeight = Math.max(120, Math.min(webcamSize.height + deltaY, 300));
        setWebcamSize({ width: newWidth, height: newHeight });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, webcamSize.width, webcamSize.height]);
  
  // Create a simple SVG placeholder as data URI
  const createPlaceholderSVG = () => {
    const svg = `
      <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <circle cx="640" cy="360" r="80" fill="#3b82f6" opacity="0.3"/>
        <polygon points="610,330 610,390 670,360" fill="#ffffff" opacity="0.8"/>
        <text x="640" y="450" font-family="sans-serif" font-size="32" font-weight="600" fill="#ffffff" text-anchor="middle">
          Video Preview Area
        </text>
        <text x="640" y="490" font-family="sans-serif" font-size="18" fill="#d1d5db" text-anchor="middle">
          Your recording will appear here
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };
  
  const placeholderImageUrl = createPlaceholderSVG();
  
  const imageDisplaySrc = (videoSrc && !isActualVideo) ? videoSrc : placeholderImageUrl;

  // Get all currently active captions from all visible tracks
  const activeCaptions = useMemo(() => {
    const active: CaptionItem[] = [];
    
    captionTracks.forEach(track => {
      if (track.isVisible) {
        track.captions.forEach(caption => {
          if (currentTime >= caption.startTime && currentTime <= caption.endTime) {
            active.push(caption);
          }
        });
      }
    });
    
    return active;
  }, [captionTracks, currentTime]);

  const renderCaption = (caption: CaptionItem, index: number) => {
    const { style } = caption;
    const isTransparent = style.backgroundColor === 'transparent' || style.backgroundColor === '#00000000';
    
    return (
      <div
        key={caption.id}
        className="absolute pointer-events-none z-10"
        style={{
          left: `${style.position.x}%`,
          top: `${style.position.y}%`,
          width: `${style.width}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${style.fontSize}px`,
          color: style.color,
          backgroundColor: isTransparent ? 'transparent' : style.backgroundColor,
          textAlign: style.textAlign,
          fontWeight: style.fontWeight,
          padding: isTransparent ? '0' : '0.25rem 0.5rem',
          borderRadius: isTransparent ? '0' : '0.25rem',
          wordWrap: 'break-word',
          textShadow: isTransparent 
            ? '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)' 
            : 'none',
          lineHeight: '1.2',
          zIndex: 10 + index, // Stack multiple captions
        }}
      >
        {caption.text}
      </div>
    );
  };

  return (
    <Card className={`bg-card border-border shadow-xl overflow-hidden ${className}`}>
      {hasMultipleVideos && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Button
              variant={viewMode === 'screen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('screen')}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Screen
            </Button>
            <Button
              variant={viewMode === 'webcam' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('webcam')}
            >
              <Camera className="h-4 w-4 mr-1" />
              Webcam
            </Button>
            <Button
              variant={viewMode === 'pip' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pip')}
            >
              <PictureInPicture className="h-4 w-4 mr-1" />
              Both
            </Button>
          </div>
          
          {/* Webcam position controls for PiP mode */}
          {viewMode === 'pip' && (
            <div className="flex flex-col space-y-2 bg-muted/20 rounded-md p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Webcam Position & Size</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setWebcamPosition({ x: 20, y: 20 });
                    setWebcamSize({ width: 240, height: 180 });
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Reset
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {/* Position presets */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamPosition({ x: 20, y: 20 })}
                  className="h-7 px-2 text-xs"
                >
                  Top Left
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamPosition({ x: window.innerWidth - webcamSize.width - 60, y: 20 })}
                  className="h-7 px-2 text-xs"
                >
                  Top Right
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamPosition({ x: 20, y: window.innerHeight - webcamSize.height - 100 })}
                  className="h-7 px-2 text-xs"
                >
                  Bottom Left
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamPosition({ x: window.innerWidth - webcamSize.width - 60, y: window.innerHeight - webcamSize.height - 100 })}
                  className="h-7 px-2 text-xs"
                >
                  Bottom Right
                </Button>
                
                {/* Size presets */}
                <div className="w-px bg-muted mx-1" />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamSize({ width: 160, height: 120 })}
                  className="h-7 px-2 text-xs"
                >
                  Small
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamSize({ width: 240, height: 180 })}
                  className="h-7 px-2 text-xs"
                >
                  Medium
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setWebcamSize({ width: 320, height: 240 })}
                  className="h-7 px-2 text-xs"
                >
                  Large
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-black">
        {(isActualVideo || isActualWebcam) ? (
          <div className="relative w-full h-full">
            {/* Main video display - screen recording or webcam in full view */}
            {(viewMode === 'screen' && isActualVideo) && (
              <video
                ref={videoRef}
                src={videoSrc!}
                controls
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onPlay={onPlay}
                onPause={onPause}
                className="w-full h-full object-contain"
                data-ai-hint="screen recording"
                crossOrigin="anonymous"
              >
                {subtitlesSrc && (
                  <track
                    src={subtitlesSrc}
                    kind="subtitles"
                    srcLang="en"
                    label="English"
                    default
                  />
                )}
              </video>
            )}

            {/* Webcam full view */}
            {(viewMode === 'webcam' && isActualWebcam) && (
              <video
                ref={webcamVideoRef}
                src={webcamSrc!}
                controls
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onPlay={onPlay}
                onPause={onPause}
                className="w-full h-full object-contain"
                data-ai-hint="webcam recording"
                crossOrigin="anonymous"
              />
            )}

            {/* Picture-in-picture mode */}
            {viewMode === 'pip' && (
              <>
                {/* Background video (screen recording) */}
                {isActualVideo && (
                  <video
                    ref={videoRef}
                    src={videoSrc!}
                    controls
                    onTimeUpdate={onTimeUpdate}
                    onLoadedMetadata={onLoadedMetadata}
                    onPlay={onPlay}
                    onPause={onPause}
                    className="w-full h-full object-contain"
                    data-ai-hint="screen recording"
                    crossOrigin="anonymous"
                  >
                    {subtitlesSrc && (
                      <track
                        src={subtitlesSrc}
                        kind="subtitles"
                        srcLang="en"
                        label="English"
                        default
                      />
                    )}
                  </video>
                )}

                {/* Draggable/resizable webcam overlay */}
                {isActualWebcam && (
                  <div
                    className={`absolute rounded-lg border-2 border-white shadow-xl bg-black group ${
                      isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    } ${isResizing ? 'cursor-nw-resize' : ''}`}
                    style={{
                      left: `${webcamPosition.x}px`,
                      top: `${webcamPosition.y}px`,
                      width: `${webcamSize.width}px`,
                      height: `${webcamSize.height}px`,
                      zIndex: 20
                    }}
                    onMouseDown={handleWebcamMouseDown}
                  >
                    <video
                      ref={webcamVideoRef}
                      src={webcamSrc!}
                      className="w-full h-full object-contain rounded-md"
                      data-ai-hint="webcam recording"
                      crossOrigin="anonymous"
                      muted // Mute to avoid audio conflicts
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-white/80 cursor-nw-resize rounded-tl-md opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={handleResizeMouseDown}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Position indicator */}
                    <div className="absolute top-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-md">
                      Drag to move • Resize from corner
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Overlay captions - always visible regardless of mode */}
            {activeCaptions.map((caption, index) => renderCaption(caption, index))}
            
            {/* Audio track */}
            {voiceoverSrc && (
              <audio
                ref={audioRef}
                src={voiceoverSrc}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
              />
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={imageDisplaySrc}
              alt="Video preview"
              data-ai-hint="preview placeholder"
              fill
              className="object-contain"
              sizes="100vw"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 group">
              <PlayCircle className="text-primary opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" size={64} />
              <p className="font-headline text-xl text-white mt-2">Video Preview Area</p>
              <p className="text-sm text-white/80">Your recording will appear here.</p>
            </div>
            
            {/* Show demo captions on placeholder */}
            {activeCaptions.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {activeCaptions.map((caption, index) => renderCaption(caption, index))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedVideoPreview; 