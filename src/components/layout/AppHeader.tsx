import type { FC } from 'react';
import AppLogo from '@/components/AppLogo';

const AppHeader: FC = () => {
  return (
    <div className="flex items-center space-x-2 p-4 border-b border-sidebar-border">
      <AppLogo />
      <h1 className="text-xl font-headline font-semibold text-sidebar-foreground">EchoReel</h1>
    </div>
  );
};

export default AppHeader;
