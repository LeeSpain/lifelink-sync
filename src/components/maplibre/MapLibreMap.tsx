import React, { ReactNode } from "react";

interface MapLibreMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  children?: ReactNode;
}

const MapLibreMap: React.FC<MapLibreMapProps> = ({ className, children }) => {
  return (
    <div className={className}>
      <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Map view</p>
      </div>
      {children}
    </div>
  );
};

export default MapLibreMap;
