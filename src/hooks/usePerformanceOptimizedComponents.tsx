import React, { memo, useMemo, useCallback } from 'react';

// Memoized components for better performance
export const MemoizedCard = memo(React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  />
)));

// Performance-optimized table row
export const OptimizedTableRow = memo<{
  customer: any;
  onViewClick: (customer: any) => void;
  onEditClick: (customer: any) => void;
}>(({ customer, onViewClick, onEditClick }) => {
  const handleView = useCallback(() => onViewClick(customer), [customer, onViewClick]);
  const handleEdit = useCallback(() => onEditClick(customer), [customer, onEditClick]);

  const displayName = useMemo(() => 
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
    [customer.first_name, customer.last_name]
  );

  const subscriptionStatus = useMemo(() => 
    customer.subscriber?.subscribed ? 'Active' : 'Inactive',
    [customer.subscriber?.subscribed]
  );

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4 font-medium">{displayName}</td>
      <td className="p-4 text-muted-foreground">{customer.phone || 'N/A'}</td>
      <td className="p-4">{customer.country || 'N/A'}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          customer.subscriber?.subscribed 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {subscriptionStatus}
        </span>
      </td>
      <td className="p-4">
        <div className="flex space-x-2">
          <button 
            onClick={handleView}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View
          </button>
          <button 
            onClick={handleEdit}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
});

// Virtual scrolling component for large lists
export const VirtualizedList = memo<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}>(({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItemCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemCount + 1, items.length);
  
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => 
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
});

MemoizedCard.displayName = 'MemoizedCard';
OptimizedTableRow.displayName = 'OptimizedTableRow';
VirtualizedList.displayName = 'VirtualizedList';