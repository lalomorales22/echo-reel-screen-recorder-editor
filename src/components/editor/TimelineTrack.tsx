import type { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TimelineTrackProps {
  title: string;
  icon: ReactNode;
  duration: number; // in seconds
  zoomLevel: number;
  trackWidth?: number; // Total track width from parent
  children?: ReactNode;
  className?: string;
}

const TimelineTrack: FC<TimelineTrackProps> = ({
  title,
  icon,
  duration,
  zoomLevel,
  trackWidth,
  children,
  className,
}) => {
  // Use trackWidth from parent if provided, otherwise calculate
  const calculatedTrackWidth = trackWidth || Math.max(duration * 50 * zoomLevel, 600);
  const contentWidth = calculatedTrackWidth - 128; // Subtract label width (w-32 = 128px)

  return (
    <div className={cn("flex items-stretch h-16 bg-card-foreground/5 rounded-md overflow-hidden", className)}>
      <div className="w-32 p-2 flex flex-col items-start justify-center border-r border-border bg-card-foreground/10 sticky left-0 z-10">
        <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground">
          <span className="h-4 w-4">{icon}</span>
          <span className="truncate">{title}</span>
        </div>
      </div>
      <div className="relative h-full" style={{ width: `${contentWidth}px`, minWidth: `${contentWidth}px`, pointerEvents: 'auto' }}>
        {/* Grid lines for timing markers */}
        {duration > 0 && Array.from({ length: Math.floor(duration / Math.max(5 / zoomLevel, 1)) + 1 }).map((_, i) => {
          const interval = Math.max(5 / zoomLevel, 1);
          const position = (i * interval / duration) * 100;
          return position <= 100 ? (
            <div
              key={`grid-${i}`}
              className="absolute top-0 bottom-0 border-l border-muted-foreground/10"
              style={{ left: `${position}%` }}
            />
          ) : null;
        })}
        {children}
      </div>
    </div>
  );
};

export default TimelineTrack;
