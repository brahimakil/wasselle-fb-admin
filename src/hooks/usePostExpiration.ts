import { useState, useEffect, useCallback } from 'react';
import { PostExpirationService } from '../services/postExpirationService';

interface UsePostExpirationResult {
  isChecking: boolean;
  lastCheck: Date | null;
  lastResult: any | null;
  checkNow: () => Promise<void>;
  autoCheckEnabled: boolean;
  setAutoCheckEnabled: (enabled: boolean) => void;
}

export const usePostExpiration = (intervalMinutes: number = 60): UsePostExpirationResult => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  const checkNow = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await PostExpirationService.checkAndExpirePosts();
      setLastResult(result);
      setLastCheck(new Date());
      
      if (result.expiredCount > 0) {
        console.log(`🎯 Auto-expired ${result.expiredCount} posts`);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error in post expiration check:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  // Set up periodic checking
  useEffect(() => {
    if (!autoCheckEnabled) return;

    // Run initial check after 10 seconds
    const initialTimeout = setTimeout(() => {
      checkNow();
    }, 10000);

    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkNow();
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [autoCheckEnabled, intervalMinutes, checkNow]);

  return {
    isChecking,
    lastCheck,
    lastResult,
    checkNow,
    autoCheckEnabled,
    setAutoCheckEnabled
  };
};
