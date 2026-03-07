import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  class: string;
  type: string;
  importance: number;
}

interface MapSearchProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  className?: string;
}

export const MapSearch: React.FC<MapSearchProps> = ({ onLocationSelect, className }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim OSM search API (free)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&extratags=1`
        );

      if (response.ok) {
        const data: SearchResult[] = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLocationSelect(lat, lng, result.display_name);
    setQuery(result.display_name.split(',')[0]); // Use first part as query
    setIsOpen(false);
    setResults([]);
  }, [onLocationSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format display name for better readability
  const formatDisplayName = (displayName: string) => {
    const parts = displayName.split(',');
    return parts.slice(0, 2).join(', '); // Show first 2 parts
  };

  return (
    <div className={cn("relative", className)} ref={resultsRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search places..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(results.length > 0)}
          className="pl-9 pr-10 bg-background/90 backdrop-blur-sm border"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <Button
              key={`${result.place_id}-${index}`}
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-left hover:bg-accent"
              onClick={() => handleResultSelect(result)}
            >
              <div className="flex items-start gap-2 w-full">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {formatDisplayName(result.display_name)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {result.display_name}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};