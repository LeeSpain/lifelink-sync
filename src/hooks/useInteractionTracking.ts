import { useEffect } from 'react';
import { trackCustomEvent } from '@/hooks/usePageTracking';

export function useScrollTracking() {
  useEffect(() => {
    let scrollDepths = [25, 50, 75, 90];
    let trackedDepths = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth);
          trackCustomEvent('scroll_depth', {
            depth_percent: depth,
            page_height: document.documentElement.scrollHeight,
            viewport_height: window.innerHeight,
            scroll_position: scrollTop
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

export function useClickTracking() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Track clicks on buttons, links, and interactive elements
      if (target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.closest('button') || 
          target.closest('a') ||
          target.getAttribute('role') === 'button') {
        
        const element = target.closest('button, a, [role="button"]') || target;
        const elementText = element.textContent?.trim().slice(0, 50) || 'Unknown';
        const elementType = element.tagName.toLowerCase();
        const elementClass = element.className;
        const elementId = element.id;
        
        trackCustomEvent('element_click', {
          element_type: elementType,
          element_text: elementText,
          element_class: elementClass,
          element_id: elementId,
          page_location: window.location.pathname,
          click_coordinates: {
            x: event.clientX,
            y: event.clientY
          },
          viewport_size: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
      }
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);
}

// Combined hook for easy usage
export function useInteractionTracking() {
  useScrollTracking();
  useClickTracking();
  useFormTracking();
  
  return {
    trackButtonClick: (buttonText: string, event?: any, data?: any) => trackCustomEvent('button_click', { button_text: buttonText, ...data }),
    trackLinkClick: (linkText: string, event?: any, data?: any) => trackCustomEvent('link_click', { link_text: linkText, ...data }),
    trackVideoInteraction: (action: string, event?: any, data?: any) => trackCustomEvent('video_interaction', { action, ...data }),
    trackSOSAction: (action: string, data?: any) => trackCustomEvent('sos_action', { action, ...data }),
    trackChatInteraction: (action: string, event?: any, data?: any) => trackCustomEvent('chat_interaction', { action, ...data })
  };
}

export function useFormTracking() {
  useEffect(() => {
    const handleFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const formFields = Array.from(formData.keys());
      
      trackCustomEvent('form_submit', {
        form_id: form.id,
        form_class: form.className,
        field_count: formFields.length,
        field_names: formFields,
        page_location: window.location.pathname
      });
    };

    const handleFormFocus = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const form = target.closest('form');
        const fieldType = target.getAttribute('type') || target.tagName.toLowerCase();
        
        trackCustomEvent('form_field_focus', {
          field_type: fieldType,
          field_name: target.getAttribute('name'),
          field_id: target.id,
          form_id: form?.id,
          page_location: window.location.pathname
        });
      }
    };

    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('focusin', handleFormFocus);
    
    return () => {
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('focusin', handleFormFocus);
    };
  }, []);
}