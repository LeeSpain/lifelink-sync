import React, { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface VirtualizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 120, 
  containerHeight = 400,
  isLoading = false,
  emptyState
}: VirtualizedListProps) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    if (isLoading || !items.length) return [];
    
    const containerElement = containerHeight;
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerElement / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, scrollTop, itemHeight, containerHeight, isLoading]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="relative"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;