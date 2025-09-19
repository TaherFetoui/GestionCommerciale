import { useState } from 'react';
import { Platform } from 'react-native';

/**
 * Custom hook for performance monitoring and optimization
 */
export function usePerformance() {
  const [isLoading, setIsLoading] = useState(false);
  const [renderTime, setRenderTime] = useState(0);
  
  const startTimer = () => {
    if (Platform.OS === 'web') {
      return performance.now();
    }
    return Date.now();
  };
  
  const endTimer = (startTime) => {
    const endTime = Platform.OS === 'web' ? performance.now() : Date.now();
    return endTime - startTime;
  };
  
  const measureRender = (callback) => {
    const start = startTimer();
    setIsLoading(true);
    
    const result = callback();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = endTimer(start);
        setRenderTime(duration);
        setIsLoading(false);
      });
    } else {
      const duration = endTimer(start);
      setRenderTime(duration);
      setIsLoading(false);
      return result;
    }
  };
  
  // Debounce function for performance optimization
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Throttle function for performance optimization
  const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  return {
    isLoading,
    renderTime,
    measureRender,
    debounce,
    throttle,
  };
}