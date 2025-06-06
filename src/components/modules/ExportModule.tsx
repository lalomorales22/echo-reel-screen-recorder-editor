"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import ExportModal from '@/components/export/ExportModal';
import type { EditDecision } from './AiToolsModule';

interface ExportModuleProps {
  videoData: { url: string; duration: number } | null; // This would be the final, edited video data
  edl: EditDecision[] | null;
  userVoiceover: { url: string; duration: number } | null;
  captionsData: string | null;
}

const ExportModule: FC<ExportModuleProps> = ({ videoData, edl, userVoiceover, captionsData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className="bg-card border-sidebar-border shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-lg text-sidebar-foreground">Export Video</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!videoData}
          >
            <Download className="mr-2 h-4 w-4" /> Export Options
          </Button>
        </CardContent>
      </Card>
      <ExportModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        videoData={videoData}
        edl={edl}
        userVoiceover={userVoiceover}
        captionsData={captionsData}
      />
    </>
  );
};

export default ExportModule;
