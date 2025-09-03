import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useViewTracking = (postId, onView) => {
  const { api, user } = useAuth();
  const elementRef = useRef(null);
  const viewCount = useRef(0);
  const viewTimer = useRef(null);

  const trackView = useCallback(async () => {
    if (!user || !postId) return;

    try {
      viewCount.current += 1;
      
      // Get user agent and other tracking data
      const trackingData = {
        postId,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString(),
        referrer: document.referrer,
        language: navigator.language,
        platform: navigator.platform,
        viewNumber: viewCount.current,
        // Add bot detection hints from client side
        isAutomated: window.navigator.webdriver || 
                    window.chrome?.runtime?.onConnect || 
                    window.phantom || 
                    window.callPhantom ||
                    navigator.userAgent.includes('HeadlessChrome')
      };

      const response = await api.post('/posts/track-view', trackingData);
      
      if (response.data.success && onView) {
        onView(response.data.data);
      }
    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't reset on error, allow multiple attempts
    }
  }, [api, user, postId, onView]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Check if 50% of the element is visible
            const visibilityRatio = entry.intersectionRatio;
            if (visibilityRatio >= 0.5) {
              // Track view immediately when visible
              trackView();
            }
          } else {
            // Clear timer if element goes out of view
            if (viewTimer.current) {
              clearTimeout(viewTimer.current);
              viewTimer.current = null;
            }
          }
        });
      },
      {
        threshold: [0.5], // Trigger when 50% visible
        rootMargin: '0px'
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (viewTimer.current) {
        clearTimeout(viewTimer.current);
      }
    };
  }, [trackView, user]);

  // Reset view count when postId changes
  useEffect(() => {
    viewCount.current = 0;
  }, [postId]);

  return elementRef;
};

export default useViewTracking;