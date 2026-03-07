import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapShellProps {
  summaryBar?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
}

export function MapShell({
  summaryBar,
  leftPanel,
  rightPanel,
  children,
  className,
  showLeftPanel = true,
  showRightPanel = false,
}: MapShellProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);

  return (
    <div className={cn('flex flex-col h-full w-full overflow-hidden', className)}>
      {/* Summary Bar */}
      {summaryBar}

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Control Panel */}
        {showLeftPanel && leftPanel && (
          <div className={cn(
            'relative z-10 bg-background border-r transition-all duration-200 flex flex-col',
            leftCollapsed ? 'w-0 overflow-hidden' : 'w-64 min-w-[256px]'
          )}>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {leftPanel}
            </div>
          </div>
        )}

        {/* Left panel toggle */}
        {showLeftPanel && leftPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="absolute top-2 left-2 z-20 h-8 w-8 p-0 bg-background/90 backdrop-blur-sm shadow-sm border"
            style={{ left: leftCollapsed ? 8 : 260 }}
          >
            {leftCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        )}

        {/* Map Canvas */}
        <div className="flex-1 relative min-w-0">
          {children}
        </div>

        {/* Right Detail Drawer */}
        {showRightPanel && rightPanel && (
          <div className="relative z-10 transition-all duration-200">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}
