/**
 * Professional marker rendering system with avatars, status indicators, and animations
 */

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  avatar?: string;
  status?: 'online' | 'idle' | 'offline';
  isEmergency?: boolean;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
}

interface MarkerRenderOptions {
  size?: number;
  showAccuracy?: boolean;
  showLabel?: boolean;
  animateStatus?: boolean;
  pixelRatio?: number;
}

export class MarkerRenderer {
  private avatarCache = new Map<string, HTMLImageElement>();
  private animationFrame: number | null = null;
  private animationTime = 0;

  /**
   * Load and cache avatar image
   */
  private async loadAvatar(url: string): Promise<HTMLImageElement | null> {
    if (this.avatarCache.has(url)) {
      return this.avatarCache.get(url)!;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.avatarCache.set(url, img);
        resolve(img);
      };
      
      img.onerror = () => {
        resolve(null);
      };

      img.src = url;
    });
  }

  /**
   * Get status color based on marker state
   */
  private getStatusColor(marker: MarkerData): string {
    if (marker.isEmergency) return '#ef4444'; // red-500
    switch (marker.status) {
      case 'online': return '#10b981'; // emerald-500
      case 'idle': return '#f59e0b'; // amber-500
      case 'offline': return '#6b7280'; // gray-500
      default: return '#3b82f6'; // blue-500
    }
  }

  /**
   * Draw accuracy circle around marker
   */
  private drawAccuracyCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    accuracyMeters: number,
    zoom: number
  ): void {
    // Convert meters to pixels (approximate)
    const metersPerPixel = 40075004 * Math.cos(0) / Math.pow(2, zoom + 8);
    const radiusPixels = Math.max(5, accuracyMeters / metersPerPixel);

    // Draw accuracy circle
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, radiusPixels, 0, 2 * Math.PI);
    ctx.fill();

    // Draw accuracy border
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draw directional arrow for moving markers
   */
  private drawDirectionArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    heading: number,
    color: string
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 180);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-4, 4);
    ctx.lineTo(0, 0);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Create a circular avatar image
   */
  private createCircularAvatar(img: HTMLImageElement, size: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = size;
    canvas.height = size;

    // Create circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.clip();

    // Draw image
    ctx.drawImage(img, 0, 0, size, size);

    return canvas;
  }

  /**
   * Draw a professional marker with all features
   */
  async renderMarker(
    ctx: CanvasRenderingContext2D,
    marker: MarkerData,
    x: number,
    y: number,
    zoom: number,
    options: MarkerRenderOptions = {}
  ): Promise<void> {
    const {
      size = 32,
      showAccuracy = true,
      showLabel = true,
      animateStatus = true,
      pixelRatio = 1
    } = options;

    // Adjust for pixel ratio
    const adjustedSize = size * pixelRatio;
    const pulseSize = animateStatus ? Math.sin(this.animationTime * 0.01) * 2 : 0;

    // Draw accuracy circle first (behind marker)
    if (showAccuracy && marker.accuracy && marker.accuracy > 0) {
      this.drawAccuracyCircle(ctx, x, y, marker.accuracy, zoom);
    }

    // Draw marker shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + 2 * pixelRatio, y + 2 * pixelRatio, (adjustedSize / 2) + 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Get marker color
    const statusColor = this.getStatusColor(marker);

    // Draw outer ring for status
    if (marker.status === 'online' || marker.isEmergency) {
      ctx.save();
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 3 * pixelRatio;
      ctx.globalAlpha = marker.isEmergency ? 0.8 : 0.6;
      ctx.beginPath();
      ctx.arc(x, y, (adjustedSize / 2) + 4 + pulseSize, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Load and draw avatar if available
    if (marker.avatar) {
      try {
        const avatarImg = await this.loadAvatar(marker.avatar);
        if (avatarImg) {
          const circularAvatar = this.createCircularAvatar(avatarImg, adjustedSize);
          ctx.drawImage(circularAvatar, x - adjustedSize / 2, y - adjustedSize / 2);
        }
      } catch (error) {
        console.warn('Failed to load avatar:', error);
      }
    }

    // Draw marker background
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(x, y, adjustedSize / 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * pixelRatio;
    ctx.stroke();

    // Draw status indicator in center
    if (!marker.avatar) {
      if (marker.isEmergency) {
        // Emergency icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(adjustedSize * 0.5)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', x, y);
      } else if (marker.status === 'online') {
        // Online pulse
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, Math.max(3, adjustedSize / 6), 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // User initial
        const initial = marker.name?.charAt(0)?.toUpperCase() || '?';
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.round(adjustedSize * 0.4)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial, x, y);
      }
    }

    // Draw direction arrow for moving markers
    if (marker.heading !== undefined && marker.speed && marker.speed > 1) {
      this.drawDirectionArrow(ctx, x, y - adjustedSize / 2 - 8, marker.heading, statusColor);
    }

    // Draw battery indicator
    if (marker.batteryLevel !== undefined && marker.batteryLevel < 20) {
      const batteryX = x + adjustedSize / 2 + 4;
      const batteryY = y - adjustedSize / 2;
      
      // Battery outline
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(batteryX, batteryY, 12, 6);
      
      // Battery level
      const fillWidth = (marker.batteryLevel / 100) * 10;
      ctx.fillStyle = marker.batteryLevel < 10 ? '#ef4444' : '#f59e0b';
      ctx.fillRect(batteryX + 1, batteryY + 1, fillWidth, 4);
    }

    // Draw name label
    if (showLabel && marker.name) {
      const labelY = y + adjustedSize / 2 + 16 * pixelRatio;
      
      // Measure text
      ctx.font = `${Math.round(12 * pixelRatio)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(marker.name).width;
      
      // Draw label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        x - textWidth / 2 - 6 * pixelRatio,
        labelY - 12 * pixelRatio,
        textWidth + 12 * pixelRatio,
        16 * pixelRatio
      );
      
      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(marker.name, x, labelY - 4 * pixelRatio);
    }

    // Emergency alert overlay
    if (marker.isEmergency && animateStatus) {
      const alertRadius = adjustedSize / 2 + 8 + Math.sin(this.animationTime * 0.02) * 4;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, alertRadius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Start animation loop
   */
  startAnimation(): void {
    if (this.animationFrame) return;
    
    const animate = () => {
      this.animationTime += 16; // ~60fps
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Stop animation loop
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Clear avatar cache
   */
  clearCache(): void {
    this.avatarCache.clear();
  }
}