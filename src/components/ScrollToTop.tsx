import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loggingService } from '@/services/loggingService';

export const ScrollToTop = () => {
  const location = useLocation();
  const [previousPathname, setPreviousPathname] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Log navigation if there was a previous path
    if (previousPathname) {
      loggingService.logNavigation(previousPathname, location.pathname);
    }
    
    setPreviousPathname(location.pathname);
  }, [location.pathname]);

  return null;
};
