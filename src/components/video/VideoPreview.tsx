
import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';

interface VideoPreviewProps {
  videoSrc?: string | null;
  className?: string;
}

const VideoPreview: FC<VideoPreviewProps> = ({ videoSrc, className }) => {
  const isActualVideo = videoSrc && videoSrc.startsWith('blob:');
  const placeholderImageUrl = "https://placehold.co/1280x720.png/000000/FFFFFF?text=Video+Preview%0AReady+to+record%3F";
  
  // Determine the source for the Image component if used
  const imageDisplaySrc = (videoSrc && !isActualVideo) ? videoSrc : placeholderImageUrl;

  return (
    <Card className={`bg-card border-border shadow-xl overflow-hidden ${className}`}>
      <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-black">
        {isActualVideo ? (
          <video
            src={videoSrc}
            controls
            autoPlay
            muted // Muted autoplay is generally allowed by browsers
            className="w-full h-full object-contain"
            data-ai-hint="screen recording"
          />
        ) : (
          // Display Image for initial placeholder or if videoSrc is an image URL
          <>
            <Image 
              src={imageDisplaySrc} 
              alt="Video preview" 
              layout="fill" 
              objectFit="contain" 
              data-ai-hint={videoSrc ? "video placeholder" : "preview placeholder"} // More specific hint
            />
            {/* Overlay shown when it's a placeholder image */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50  hover:bg-black/30 transition-colors cursor-pointer group">
                <PlayCircle size={64} className="text-primary opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                {!videoSrc && ( // Only show this text if truly no video source yet (initial state)
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

    