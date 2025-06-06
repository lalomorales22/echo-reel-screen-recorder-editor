
import type { FC, RefObject } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';

interface VideoPreviewProps {
  videoSrc?: string | null;
  videoRef: RefObject<HTMLVideoElement>;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onPlay: () => void;
  onPause: () => void;
  className?: string;
}

const VideoPreview: FC<VideoPreviewProps> = ({ 
  videoSrc, 
  videoRef,
  onTimeUpdate,
  onLoadedMetadata,
  onPlay,
  onPause,
  className 
}) => {
  const isActualVideo = videoSrc && (videoSrc.startsWith('blob:') || videoSrc.startsWith('data:video'));
  const placeholderImageUrl = "https://placehold.co/1280x720.png/000000/FFFFFF?text=Video+Preview%0AReady+to+record%3F";
  
  const imageDisplaySrc = (videoSrc && !isActualVideo) ? videoSrc : placeholderImageUrl;

  return (
    <Card className={`bg-card border-border shadow-xl overflow-hidden ${className}`}>
      <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-black">
        {videoSrc && isActualVideo ? (
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onPlay={onPlay}
            onPause={onPause}
            className="w-full h-full object-contain"
            data-ai-hint="screen recording"
          />
        ) : (
          <>
            <Image 
              src={imageDisplaySrc} 
              alt="Video preview" 
              fill // Use fill for Next.js v13+ for responsive images within parent
              style={{ objectFit: 'contain' }} // Use style prop for objectFit with fill
              data-ai-hint={videoSrc ? "video placeholder" : "preview placeholder"}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 group">
                <PlayCircle size={64} className="text-primary opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                {!videoSrc && (
                <>
                  <p className="font-headline text-xl text-white mt-2">Video Preview Area</p>
                  <p className="text-sm text-white/80">Your recording will appear here.</p>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPreview;
