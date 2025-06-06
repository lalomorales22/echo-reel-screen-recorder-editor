import { FC, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, X, Edit3, Scissors, ZoomIn, Highlighter, Clock } from 'lucide-react';
import type { EditDecision } from '@/components/modules/AiToolsModule';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EditSegmentProps {
  edit: EditDecision;
  videoDuration: number;
  trackWidth: number;
  zoomLevel: number;
  onAccept: (id: string) => void;
  onReject?: (id: string) => void;
  onModify: (updates: Partial<EditDecision>) => void;
}

const EditSegment: FC<EditSegmentProps> = ({ edit, videoDuration, trackWidth, zoomLevel, onAccept, onReject, onModify }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState<false | 'left' | 'right'>(false);
  const [localEdit, setLocalEdit] = useState(edit);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const segmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalEdit(edit);
  }, [edit]);

  const handleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right') => {
    e.stopPropagation();
    setIsDragging(handle);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!segmentRef.current) return;
      
      const timelineRect = segmentRef.current.parentElement!.getBoundingClientRect();
      const pixelsPerSecond = trackWidth / videoDuration;
      let newTime = (e.clientX - timelineRect.left) / pixelsPerSecond;
      newTime = Math.max(0, Math.min(newTime, videoDuration));

      if (isDragging === 'left') {
        if (newTime < localEdit.endTime - 0.1) { // Minimum 0.1s duration
          setLocalEdit(prev => ({ ...prev, startTime: newTime }));
        }
      } else if (isDragging === 'right') {
        if (newTime > localEdit.startTime + 0.1) { // Minimum 0.1s duration
          setLocalEdit(prev => ({ ...prev, endTime: newTime }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Only update if there's a meaningful change
      if (Math.abs(localEdit.startTime - edit.startTime) > 0.1 || Math.abs(localEdit.endTime - edit.endTime) > 0.1) {
        onModify({ startTime: localEdit.startTime, endTime: localEdit.endTime });
        toast({ 
          title: "Edit Updated", 
          description: `${edit.action} timing adjusted`,
          variant: "default" 
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, videoDuration, onModify, localEdit.startTime, localEdit.endTime, trackWidth, edit.startTime, edit.endTime, edit.action, toast]);

  const startPercent = (localEdit.startTime / videoDuration) * 100;
  const widthPercent = ((localEdit.endTime - localEdit.startTime) / videoDuration) * 100;

  const segmentConfig = {
    cut: {
      color: 'bg-red-500/70 hover:bg-red-400/70 border-red-400',
      icon: Scissors,
      description: 'Remove this segment from the final video'
    },
    zoom: {
      color: 'bg-blue-500/70 hover:bg-blue-400/70 border-blue-400',
      icon: ZoomIn,
      description: 'Zoom in to highlight this area'
    },
    highlight: {
      color: 'bg-yellow-500/70 hover:bg-yellow-400/70 border-yellow-400',
      icon: Highlighter,
      description: 'Add visual emphasis to this segment'
    },
  }[edit.action];

  const Icon = segmentConfig.icon;
  const duration = localEdit.endTime - localEdit.startTime;

  const handleAccept = () => {
    setIsApplied(true);
    onAccept(edit.id);
    toast({ 
      title: "Edit Applied", 
      description: `${edit.action} will be included in the final video`,
      variant: "default" 
    });
  };

  const handleReject = () => {
    if (onReject) {
      onReject(edit.id);
      toast({ 
        title: "Edit Rejected", 
        description: `${edit.action} suggestion removed`,
        variant: "default" 
      });
    }
    setShowDeleteDialog(false);
  };

  const handleModifyClick = () => {
    // For now, just show timing info - could open a detailed edit dialog
    toast({ 
      title: "Edit Details", 
      description: `${edit.action}: ${duration.toFixed(1)}s segment. Drag edges to adjust timing.`,
      variant: "default" 
    });
  };

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={segmentRef}
              className={cn(
                "absolute top-1 bottom-1 rounded group flex items-center justify-between px-2 text-xs font-medium text-white shadow-md cursor-pointer overflow-hidden transition-all",
                segmentConfig.color,
                isApplied && "opacity-60 saturate-50",
                isDragging && "shadow-lg z-20"
              )}
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(widthPercent, 3)}%`, // Minimum 3% width for visibility
                minWidth: '60px',
                zIndex: 15, // Ensure edit segments are above timeline content
                pointerEvents: 'auto' // Ensure pointer events work
              }}
              onMouseDown={(e) => {
                // Only allow dragging on the main body, not on buttons
                const target = e.target as HTMLElement;
                if (!target.closest('button')) {
                  e.stopPropagation();
                }
              }}
            >
              {/* Left resize handle */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'left');
                }} 
              />
              
              {/* Content */}
              <div className="flex items-center truncate pointer-events-none">
                <Icon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{edit.action.charAt(0).toUpperCase() + edit.action.slice(1)}</span>
              </div>
              
              {/* Duration indicator for small segments */}
              {duration < 2 && (
                <div className="absolute bottom-0 right-1 text-[10px] opacity-70 pointer-events-none">
                  {duration.toFixed(1)}s
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 p-0.5 rounded backdrop-blur-sm"
                   style={{ zIndex: 20, pointerEvents: 'auto' }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 text-green-300 hover:text-green-200 hover:bg-green-500/20" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Accept button clicked for edit:', edit.id); // Debug log
                    handleAccept();
                  }}
                  disabled={isApplied}
                  style={{ pointerEvents: 'auto' }}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Modify button clicked for edit:', edit.id); // Debug log
                    handleModifyClick();
                  }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 p-0 text-red-300 hover:text-red-200 hover:bg-red-500/20" 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Delete button clicked for edit:', edit.id); // Debug log
                    setShowDeleteDialog(true);
                  }}
                  style={{ pointerEvents: 'auto' }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Right resize handle */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'right');
                }} 
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground border-border max-w-sm">
            <div className="space-y-1">
              <p className="font-semibold flex items-center">
                <Icon className="h-4 w-4 mr-1" />
                {edit.action.charAt(0).toUpperCase() + edit.action.slice(1)}
              </p>
              <p className="text-sm">{segmentConfig.description}</p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {localEdit.startTime.toFixed(1)}s - {localEdit.endTime.toFixed(1)}s
                </span>
                <span>Duration: {duration.toFixed(1)}s</span>
              </div>
              {edit.details && (
                <p className="text-xs border-t border-border pt-1 mt-1">{edit.details}</p>
              )}
              <p className="text-xs text-muted-foreground border-t border-border pt-1 mt-1">
                Drag edges to adjust timing • Click icons to accept, modify, or reject
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Edit Suggestion?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this {edit.action} suggestion? This action cannot be undone.
              {edit.details && (
                <>
                  <br /><br />
                  <strong>Details:</strong> {edit.details}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Edit</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
              Remove Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditSegment;
