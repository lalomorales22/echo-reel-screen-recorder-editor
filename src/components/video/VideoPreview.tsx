import type { FC } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';

interface VideoPreviewProps {
  videoSrc?: string | null;
  className?: string;
}

const VideoPreview: FC<VideoPreviewProps> = ({ videoSrc, className }) => {
  const displaySrc = videoSrc || "https://placehold.co/1280x720.png/000000/FFFFFF?text=Video+Preview\\nReady+to+record%3F";
  
  return (
    <Card className={`bg-card border-border shadow-xl overflow-hidden ${className}`}>
      <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-black">
        {videoSrc ? (
            <Image 
              src={displaySrc} 
              alt="Video preview" 
              layout="fill" 
              objectFit="contain" 
              data-ai-hint="video screen"
            />
        ) : (
            <div className="text-center text-muted-foreground p-8">
                <PlayCircle size={64} className="mx-auto mb-4 text-primary" />
                <p className="font-headline text-xl">Video Preview Area</p>
                <p className="text-sm">Your recording will appear here.</p>
            </div>
        )}
         {videoSrc && (
          <div className="absolute inset-0 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <PlayCircle size={80} className="text-background/80 drop-shadow-lg" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPreview;
