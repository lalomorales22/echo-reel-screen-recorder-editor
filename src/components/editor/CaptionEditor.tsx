"use client";

import { FC, useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Trash2, Edit3, Move, Type, Palette, Clock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CaptionItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    position: { x: number; y: number }; // Percentage position on video
    width: number; // Percentage width
    textAlign: 'left' | 'center' | 'right';
    fontWeight: 'normal' | 'bold';
  };
}

export interface CaptionTrack {
  id: string;
  name: string;
  language: string;
  captions: CaptionItem[];
  isVisible: boolean;
}

interface CaptionEditorProps {
  captionTracks: CaptionTrack[];
  onCaptionTracksChange: (tracks: CaptionTrack[]) => void;
  videoDuration: number;
  currentTime: number;
  className?: string;
}

const CaptionEditor: FC<CaptionEditorProps> = ({
  captionTracks,
  onCaptionTracksChange,
  videoDuration,
  currentTime,
  className
}) => {
  const { toast } = useToast();
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    captionTracks.length > 0 ? captionTracks[0].id : null
  );
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  
  const selectedTrack = captionTracks.find(track => track.id === selectedTrackId);
  const selectedCaption = selectedTrack?.captions.find(caption => caption.id === selectedCaptionId);

  const addNewTrack = () => {
    const newTrack: CaptionTrack = {
      id: `track-${Date.now()}`,
      name: `Caption Track ${captionTracks.length + 1}`,
      language: 'en',
      captions: [],
      isVisible: true
    };
    
    const updatedTracks = [...captionTracks, newTrack];
    onCaptionTracksChange(updatedTracks);
    setSelectedTrackId(newTrack.id);
    toast({ title: "New Track Added", description: `Created ${newTrack.name}` });
  };

  const deleteTrack = (trackId: string) => {
    const updatedTracks = captionTracks.filter(track => track.id !== trackId);
    onCaptionTracksChange(updatedTracks);
    
    if (selectedTrackId === trackId) {
      setSelectedTrackId(updatedTracks.length > 0 ? updatedTracks[0].id : null);
    }
    toast({ title: "Track Deleted", description: "Caption track removed" });
  };

  const toggleTrackVisibility = (trackId: string) => {
    const updatedTracks = captionTracks.map(track =>
      track.id === trackId ? { ...track, isVisible: !track.isVisible } : track
    );
    onCaptionTracksChange(updatedTracks);
  };

  const addNewCaption = () => {
    if (!selectedTrack) {
      toast({ title: "No Track Selected", description: "Please select or create a caption track first.", variant: "destructive" });
      return;
    }

    const newCaption: CaptionItem = {
      id: `caption-${Date.now()}`,
      startTime: Math.max(0, currentTime),
      endTime: Math.min(videoDuration, currentTime + 3), // Default 3-second duration
      text: "New caption text",
      style: {
        fontSize: 16,
        color: '#FFFFFF',
        backgroundColor: 'transparent', // Default to transparent for better appearance
        position: { x: 50, y: 85 }, // Bottom center
        width: 80,
        textAlign: 'center',
        fontWeight: 'normal'
      }
    };

    const updatedTracks = captionTracks.map(track =>
      track.id === selectedTrackId
        ? { ...track, captions: [...track.captions, newCaption].sort((a, b) => a.startTime - b.startTime) }
        : track
    );

    onCaptionTracksChange(updatedTracks);
    setSelectedCaptionId(newCaption.id);
    setEditingCaptionId(newCaption.id);
    toast({ title: "Caption Added", description: "New caption created at current time" });
  };

  const deleteCaption = (captionId: string) => {
    if (!selectedTrack) return;

    const updatedTracks = captionTracks.map(track =>
      track.id === selectedTrackId
        ? { ...track, captions: track.captions.filter(caption => caption.id !== captionId) }
        : track
    );

    onCaptionTracksChange(updatedTracks);
    
    if (selectedCaptionId === captionId) {
      setSelectedCaptionId(null);
    }
    toast({ title: "Caption Deleted", description: "Caption removed" });
  };

  const updateCaption = (captionId: string, updates: Partial<CaptionItem>) => {
    if (!selectedTrack) return;

    const updatedTracks = captionTracks.map(track =>
      track.id === selectedTrackId
        ? {
            ...track,
            captions: track.captions.map(caption =>
              caption.id === captionId ? { ...caption, ...updates } : caption
            )
          }
        : track
    );

    onCaptionTracksChange(updatedTracks);
  };

  const updateCaptionStyle = (captionId: string, styleUpdates: Partial<CaptionItem['style']>) => {
    if (!selectedTrack) return;

    const updatedTracks = captionTracks.map(track =>
      track.id === selectedTrackId
        ? {
            ...track,
            captions: track.captions.map(caption =>
              caption.id === captionId 
                ? { ...caption, style: { ...caption.style, ...styleUpdates } }
                : caption
            )
          }
        : track
    );

    onCaptionTracksChange(updatedTracks);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return isNaN(seconds) ? "00:00:00" : `${h}:${m}:${s}`;
  };

  const getCurrentCaptions = (): CaptionItem[] => {
    if (!selectedTrack) return [];
    return selectedTrack.captions.filter(
      caption => currentTime >= caption.startTime && currentTime <= caption.endTime
    );
  };

  return (
    <Card className={`bg-card border-border shadow-xl flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
        <CardTitle className="font-headline text-lg text-card-foreground">Caption Editor</CardTitle>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={addNewTrack} variant="outline" className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4 mr-1" />
            Add Track
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow">
          <div className="space-y-4 pr-4">
            {/* Track Selection */}
            <div className="space-y-2">
              <Label htmlFor="track-select" className="text-sm font-medium">Caption Track</Label>
              {captionTracks.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <Select value={selectedTrackId || undefined} onValueChange={setSelectedTrackId}>
                    <SelectTrigger id="track-select" className="flex-1">
                      <SelectValue placeholder="Select a caption track" />
                    </SelectTrigger>
                    <SelectContent>
                      {captionTracks.map(track => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name} ({track.language})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTrackId && (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => toggleTrackVisibility(selectedTrackId)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {selectedTrack?.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteTrack(selectedTrackId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-muted">
                  <p className="text-muted-foreground mb-3">No caption tracks available</p>
                  <Button onClick={addNewTrack} variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Create First Track
                  </Button>
                </div>
              )}
            </div>

            {selectedTrack && (
              <>
                <Separator className="my-4" />
                
                {/* Caption List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Captions ({selectedTrack.captions.length})</Label>
                    <Button size="sm" onClick={addNewCaption} variant="outline" className="text-muted-foreground hover:text-foreground">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Caption
                    </Button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2 bg-muted/10 rounded-lg p-3 border">
                    {selectedTrack.captions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">No captions in this track</p>
                      </div>
                    ) : (
                      selectedTrack.captions.map(caption => {
                        const isActive = currentTime >= caption.startTime && currentTime <= caption.endTime;
                        const isSelected = selectedCaptionId === caption.id;
                        
                        return (
                          <div 
                            key={caption.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                              isSelected ? 'border-primary bg-primary/10 shadow-sm' : 
                              isActive ? 'border-yellow-500 bg-yellow-500/10 shadow-sm' :
                              'border-border hover:border-primary/50 bg-card'
                            }`}
                            onClick={() => setSelectedCaptionId(caption.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate mb-1">{caption.text}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(caption.startTime)} → {formatTime(caption.endTime)}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCaptionId(caption.id);
                                    setSelectedCaptionId(caption.id);
                                  }}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCaption(caption.id);
                                  }}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Caption Editor */}
                {selectedCaption && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <Label className="flex items-center text-sm font-medium">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Caption
                      </Label>
                      
                      {/* Text Editor */}
                      <div className="space-y-2">
                        <Label htmlFor="caption-text" className="text-sm">Text</Label>
                        <Textarea
                          id="caption-text"
                          value={selectedCaption.text}
                          onChange={(e) => updateCaption(selectedCaption.id, { text: e.target.value })}
                          placeholder="Enter caption text..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>

                      {/* Timing */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                          <Input
                            id="start-time"
                            type="number"
                            value={selectedCaption.startTime.toFixed(1)}
                            onChange={(e) => updateCaption(selectedCaption.id, { startTime: parseFloat(e.target.value) || 0 })}
                            step="0.1"
                            min="0"
                            max={videoDuration}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-time" className="text-sm">End Time</Label>
                          <Input
                            id="end-time"
                            type="number"
                            value={selectedCaption.endTime.toFixed(1)}
                            onChange={(e) => updateCaption(selectedCaption.id, { endTime: parseFloat(e.target.value) || 0 })}
                            step="0.1"
                            min="0"
                            max={videoDuration}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Styling */}
                      <div className="space-y-3">
                        <Label className="flex items-center text-sm font-medium">
                          <Type className="h-4 w-4 mr-2" />
                          Style
                        </Label>
                        
                        {/* Font Size */}
                        <div className="space-y-2">
                          <Label htmlFor="font-size" className="text-sm">Font Size: {selectedCaption.style.fontSize}px</Label>
                          <Slider
                            id="font-size"
                            value={[selectedCaption.style.fontSize]}
                            onValueChange={([value]) => updateCaptionStyle(selectedCaption.id, { fontSize: value })}
                            min={12}
                            max={48}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Position */}
                        <div className="space-y-2">
                          <Label className="text-sm">Position on Video</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="pos-x" className="text-xs text-muted-foreground">Horizontal: {selectedCaption.style.position.x}%</Label>
                              <Slider
                                id="pos-x"
                                value={[selectedCaption.style.position.x]}
                                onValueChange={([value]) => updateCaptionStyle(selectedCaption.id, { 
                                  position: { ...selectedCaption.style.position, x: value } 
                                })}
                                min={0}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="pos-y" className="text-xs text-muted-foreground">Vertical: {selectedCaption.style.position.y}%</Label>
                              <Slider
                                id="pos-y"
                                value={[selectedCaption.style.position.y]}
                                onValueChange={([value]) => updateCaptionStyle(selectedCaption.id, { 
                                  position: { ...selectedCaption.style.position, y: value } 
                                })}
                                min={0}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Width */}
                        <div className="space-y-2">
                          <Label htmlFor="caption-width" className="text-sm">Width: {selectedCaption.style.width}%</Label>
                          <Slider
                            id="caption-width"
                            value={[selectedCaption.style.width]}
                            onValueChange={([value]) => updateCaptionStyle(selectedCaption.id, { width: value })}
                            min={20}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        {/* Colors and Alignment */}
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="text-color" className="text-sm">Text Color</Label>
                            <Input
                              id="text-color"
                              type="color"
                              value={selectedCaption.style.color}
                              onChange={(e) => updateCaptionStyle(selectedCaption.id, { color: e.target.value })}
                              className="h-10 cursor-pointer"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="bg-color" className="text-sm">Background</Label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="transparent-bg"
                                  checked={selectedCaption.style.backgroundColor === 'transparent' || selectedCaption.style.backgroundColor === '#00000000'}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      updateCaptionStyle(selectedCaption.id, { backgroundColor: 'transparent' });
                                    } else {
                                      updateCaptionStyle(selectedCaption.id, { backgroundColor: '#000000' });
                                    }
                                  }}
                                  className="rounded"
                                />
                                <Label htmlFor="transparent-bg" className="text-xs text-muted-foreground cursor-pointer">
                                  Transparent
                                </Label>
                              </div>
                            </div>
                            <Input
                              id="bg-color"
                              type="color"
                              value={selectedCaption.style.backgroundColor === 'transparent' || selectedCaption.style.backgroundColor === '#00000000' ? '#000000' : selectedCaption.style.backgroundColor}
                              onChange={(e) => updateCaptionStyle(selectedCaption.id, { backgroundColor: e.target.value })}
                              className="h-10 cursor-pointer"
                              disabled={selectedCaption.style.backgroundColor === 'transparent' || selectedCaption.style.backgroundColor === '#00000000'}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="text-align" className="text-sm">Text Align</Label>
                            <Select 
                              value={selectedCaption.style.textAlign} 
                              onValueChange={(value: any) => updateCaptionStyle(selectedCaption.id, { textAlign: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="font-weight" className="text-sm">Font Weight</Label>
                            <Select 
                              value={selectedCaption.style.fontWeight} 
                              onValueChange={(value: any) => updateCaptionStyle(selectedCaption.id, { fontWeight: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Current Active Captions */}
            {getCurrentCaptions().length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">
                    <Clock className="h-4 w-4 mr-2" />
                    Currently Active ({getCurrentCaptions().length})
                  </Label>
                  <div className="space-y-2">
                    {getCurrentCaptions().map(caption => (
                      <div key={caption.id} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                        <div className="font-medium">"{caption.text}"</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(caption.startTime)} → {formatTime(caption.endTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CaptionEditor; 