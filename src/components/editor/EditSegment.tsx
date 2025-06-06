import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X, Edit3, Scissors, ZoomIn, Highlighter } from 'lucide-react';
import type { EditDecision } from '@/components/modules/AiToolsModule'; // Re-using type
import { cn } from '@/lib/utils';

interface EditSegmentProps {
  edit: EditDecision;
  videoDuration: number;
  zoomLevel: number;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onModify: (id:string) => void;
}

const EditSegment: FC<EditSegmentProps> = ({ edit, videoDuration, zoomLevel, onAccept, onReject, onModify }) => {
  const startPercent = (edit.startTime / videoDuration) * 100;
  const widthPercent = ((edit.endTime - edit.startTime) / videoDuration) * 100;

  const segmentColor = {
    cut: 'bg-red-500/70 hover:bg-red-400/70 border-red-400',
    zoom: 'bg-blue-500/70 hover:bg-blue-400/70 border-blue-400',
    highlight: 'bg-yellow-500/70 hover:bg-yellow-400/70 border-yellow-400',
  }[edit.action];

  const Icon = {
    cut: Scissors,
    zoom: ZoomIn,
    highlight: Highlighter,
  }[edit.action];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-1 bottom-1 rounded group flex items-center justify-between px-2 text-xs font-medium text-white shadow-md cursor-pointer overflow-hidden",
              segmentColor
            )}
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
              minWidth: '60px', // Ensure enough space for icons at low zoom
            }}
          >
            <div className="flex items-center truncate">
              <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{edit.action.charAt(0).toUpperCase() + edit.action.slice(1)}</span>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 p-0.5 rounded">
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-green-300 hover:text-green-200" onClick={() => onAccept(edit.id)}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-yellow-300 hover:text-yellow-200" onClick={() => onModify(edit.id)}>
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-red-300 hover:text-red-200" onClick={() => onReject(edit.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground border-border">
          <p className="font-semibold">{edit.action.charAt(0).toUpperCase() + edit.action.slice(1)}</p>
          <p>Start: {edit.startTime.toFixed(2)}s, End: {edit.endTime.toFixed(2)}s</p>
          {edit.details && <p>Details: {edit.details}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EditSegment;
