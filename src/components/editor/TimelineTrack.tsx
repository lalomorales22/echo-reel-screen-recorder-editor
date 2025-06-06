import type { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TimelineTrackProps {
  title: string;
  icon: ReactNode;
  duration: number; // in seconds
  zoomLevel: number;
  children?: ReactNode;
  className?: string;
}

const TimelineTrack: FC<TimelineTrackProps> = ({
  title,
  icon,
  duration,
  zoomLevel,
  children,
  className,
}) => {
  const trackPixelWidth = duration * 10 * zoomLevel; // 10px per second at 100% zoom

  return (
    <div className={cn("flex items-stretch h-16 bg-card-foreground/5 rounded-md overflow-hidden", className)}>
      <div className="w-32 p-2 flex flex-col items-start justify-center border-r border-border bg-card-foreground/10 sticky left-0 z-10">
        <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
          <span className="h-4 w-4">{icon}</span>
          <span>{title}</span>
        </div>
      </div>
      <div className="relative flex-grow h-full" style={{ minWidth: `${Math.max(trackPixelWidth,100)}px` }}>
        {/* Grid lines for timing markers (optional) */}
        {Array.from({ length: Math.floor(duration / (5 / zoomLevel)) +1 }).map((_, i) => ( // Dynamic grid lines based on zoom
          <div
            key={`grid-${i}`}
            className="absolute top-0 bottom-0 border-l border-muted-foreground/10"
            style={{ left: `${(i * (5 / zoomLevel) * 10 * zoomLevel)}px` }} 
          />
        ))}
        {children}
      </div>
    </div>
  );
};

export default TimelineTrack;
