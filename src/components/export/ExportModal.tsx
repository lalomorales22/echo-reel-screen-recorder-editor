"use client";

import type { FC } from 'react';
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

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ExportModal: FC<ExportModalProps> = ({ isOpen, onOpenChange }) => {
  const { toast } = useToast();

  const handleExport = () => {
    // Simulate export process
    toast({ title: "Export Started", description: "Your video is being processed." });
    onOpenChange(false); 
    // In a real app, this would trigger an export function.
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-muted-foreground border-muted-foreground/50 hover:bg-muted/20">Cancel</Button>
          <Button type="submit" onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground">Start Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
