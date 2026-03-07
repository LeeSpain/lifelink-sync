import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, Wifi, WifiOff } from "lucide-react";

interface Circle {
  id: string;
  name: string;
  member_count?: number;
}

interface CircleSwitcherProps {
  circles: Circle[];
  activeId: string | null;
  onChange: (id: string) => void;
}

export function CircleSwitcher({ circles, activeId, onChange }: CircleSwitcherProps) {
  if (circles.length === 0) {
    return (
      <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <WifiOff className="w-4 h-4" />
          <span>No family circles found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {circles.map((circle) => {
        const isActive = activeId === circle.id;
        
        return (
          <button
            key={circle.id}
            onClick={() => onChange(circle.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 whitespace-nowrap
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-md scale-105" 
                : "bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-accent hover:text-accent-foreground"
              }
            `}
          >
            <div className="flex items-center gap-2">
              {isActive ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              <span className="font-medium">{circle.name}</span>
            </div>
            
            {circle.member_count !== undefined && (
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className="ml-1 text-xs px-1.5 py-0.5"
              >
                {circle.member_count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}