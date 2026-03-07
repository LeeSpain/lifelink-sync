// Universal Map Configuration for LifeLink Sync Platform
// This ensures consistent map appearance and behavior across all apps

export interface MapConfig {
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  tileProviders: {
    primary: string;
    fallback: string[];
  };
  appearance: {
    borderRadius: string;
    controlStyle: 'modern' | 'minimal' | 'professional';
    showAttribution: boolean;
    showCoordinates: boolean;
    enableSmoothTransitions: boolean;
  };
  emergency: {
    emergencyZoom: number;
    emergencyPulseAnimation: boolean;
    emergencyGlowEffect: boolean;
  };
}

// Global map configuration - used by all apps on the platform
export const PLATFORM_MAP_CONFIG: MapConfig = {
  defaultCenter: { lat: 40.7589, lng: -73.9851 }, // NYC as default
  defaultZoom: 13,
  minZoom: 2,
  maxZoom: 18,
  
  tileProviders: {
    primary: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    fallback: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ]
  },
  
  appearance: {
    borderRadius: '0.75rem', // --radius value
    controlStyle: 'professional',
    showAttribution: true,
    showCoordinates: true,
    enableSmoothTransitions: true
  },
  
  emergency: {
    emergencyZoom: 16,
    emergencyPulseAnimation: true,
    emergencyGlowEffect: true
  }
};

// Standardized map marker styles
export const MAP_MARKER_STYLES = {
  family: {
    online: {
      color: 'hsl(var(--wellness))',
      glow: 'hsl(var(--wellness) / 0.3)',
      size: 'large'
    },
    idle: {
      color: 'hsl(var(--warning))',
      glow: 'hsl(var(--warning) / 0.3)', 
      size: 'medium'
    },
    offline: {
      color: 'hsl(var(--muted-foreground))',
      glow: 'none',
      size: 'small'
    }
  },
  emergency: {
    active: {
      color: 'hsl(var(--emergency))',
      glow: 'hsl(var(--emergency) / 0.5)',
      size: 'extra-large',
      pulse: true
    },
    resolved: {
      color: 'hsl(var(--wellness))',
      glow: 'hsl(var(--wellness) / 0.3)',
      size: 'large'
    }
  },
  guardian: {
    monitoring: {
      color: 'hsl(var(--guardian))',
      glow: 'hsl(var(--guardian) / 0.3)',
      size: 'large'
    }
  }
} as const;

// Control button configurations
export const MAP_CONTROLS = {
  professional: {
    background: 'bg-map-control',
    foreground: 'text-map-control-foreground',
    hover: 'hover:bg-map-control-hover',
    border: 'border border-map-border',
    shadow: 'shadow-map',
    rounded: 'rounded-lg',
    spacing: 'p-2'
  },
  modern: {
    background: 'bg-background/95 backdrop-blur-sm',
    foreground: 'text-foreground',
    hover: 'hover:bg-accent',
    border: 'border border-border',
    shadow: 'shadow-md',
    rounded: 'rounded-xl',
    spacing: 'p-3'
  },
  minimal: {
    background: 'bg-background/80',
    foreground: 'text-foreground',
    hover: 'hover:bg-accent/50',
    border: '',
    shadow: 'shadow-sm',
    rounded: 'rounded-lg',
    spacing: 'p-2'
  }
} as const;

// Animation configurations
export const MAP_ANIMATIONS = {
  zoom: 'transition-map ease-map duration-300',
  pan: 'transition-map ease-map duration-200',
  marker: 'transition-all duration-200 ease-in-out',
  emergency: 'animate-pulse shadow-emergency',
  glow: 'shadow-map-glow'
} as const;