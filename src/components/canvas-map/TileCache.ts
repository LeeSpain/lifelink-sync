/**
 * Professional tile caching system for enhanced map performance
 */

interface TileData {
  image: HTMLImageElement;
  timestamp: number;
  loading: boolean;
  error: boolean;
}

class TileCache {
  private cache = new Map<string, TileData>();
  private readonly maxSize: number;
  private readonly maxAge: number; // in milliseconds
  private loadingPromises = new Map<string, Promise<HTMLImageElement | null>>();

  constructor(maxSize = 500, maxAge = 30 * 60 * 1000) { // 30 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Get tile key for caching
   */
  private getTileKey(x: number, y: number, z: number, mode: 'standard' | 'satellite'): string {
    return `${mode}-${x}-${y}-${z}`;
  }

  /**
   * Get tile URL based on mode and coordinates
   */
  private getTileUrl(x: number, y: number, z: number, mode: 'standard' | 'satellite'): string {
    if (mode === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  /**
   * Load a tile with caching and error handling
   */
  async loadTile(x: number, y: number, z: number, mode: 'standard' | 'satellite' = 'standard'): Promise<HTMLImageElement | null> {
    const key = this.getTileKey(x, y, z, mode);
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && !cached.error && (Date.now() - cached.timestamp) < this.maxAge) {
      return cached.image;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Create loading promise
    const loadingPromise = this.createLoadingPromise(x, y, z, mode, key);
    this.loadingPromises.set(key, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(key);
      return result;
    } catch (error) {
      this.loadingPromises.delete(key);
      return null;
    }
  }

  /**
   * Create a promise for loading a tile
   */
  private createLoadingPromise(x: number, y: number, z: number, mode: 'standard' | 'satellite', key: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Set loading state
      this.cache.set(key, {
        image: img,
        timestamp: Date.now(),
        loading: true,
        error: false
      });

      img.onload = () => {
        this.cache.set(key, {
          image: img,
          timestamp: Date.now(),
          loading: false,
          error: false
        });
        this.cleanupCache();
        resolve(img);
      };

      img.onerror = () => {
        this.cache.set(key, {
          image: img,
          timestamp: Date.now(),
          loading: false,
          error: true
        });
        resolve(null);
      };

      img.src = this.getTileUrl(x, y, z, mode);
    });
  }

  /**
   * Check if tile is cached and valid
   */
  isLoaded(x: number, y: number, z: number, mode: 'standard' | 'satellite' = 'standard'): boolean {
    const key = this.getTileKey(x, y, z, mode);
    const cached = this.cache.get(key);
    return !!(cached && !cached.loading && !cached.error && (Date.now() - cached.timestamp) < this.maxAge);
  }

  /**
   * Check if tile is currently loading
   */
  isLoading(x: number, y: number, z: number, mode: 'standard' | 'satellite' = 'standard'): boolean {
    const key = this.getTileKey(x, y, z, mode);
    return this.loadingPromises.has(key) || this.cache.get(key)?.loading || false;
  }

  /**
   * Get cached tile if available
   */
  getTile(x: number, y: number, z: number, mode: 'standard' | 'satellite' = 'standard'): HTMLImageElement | null {
    const key = this.getTileKey(x, y, z, mode);
    const cached = this.cache.get(key);
    if (cached && !cached.error && !cached.loading) {
      return cached.image;
    }
    return null;
  }

  /**
   * Clean up old entries to maintain cache size
   */
  private cleanupCache(): void {
    if (this.cache.size <= this.maxSize) return;

    // Sort by timestamp and remove oldest entries
    const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - this.maxSize + 50); // Remove extra to avoid frequent cleanup
    
    for (const [key] of toRemove) {
      this.cache.delete(key);
    }
  }

  /**
   * Clear all cached tiles
   */
  clear(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? Array.from(this.cache.values()).filter(t => !t.error).length / this.cache.size : 0
    };
  }
}

// Export singleton instance
export const tileCache = new TileCache();