import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    setOrientation(width > height ? 'landscape' : 'portrait');
  }, [width, height]);

  const deviceType = width < breakpoints.mobile 
    ? 'mobile' 
    : width < breakpoints.tablet 
      ? 'tablet' 
      : width < breakpoints.desktop 
        ? 'desktop' 
        : 'large';

  return {
    width,
    height,
    orientation,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop' || deviceType === 'large',
    isLarge: deviceType === 'large',
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    // Utility functions for responsive design
    getColumns: () => {
      if (deviceType === 'mobile') return 1;
      if (deviceType === 'tablet') return 2;
      if (deviceType === 'desktop') return 3;
      return 4;
    },
    getSidebarWidth: () => {
      if (deviceType === 'mobile') return '100%';
      if (deviceType === 'tablet') return 280;
      return 320;
    },
    getContentPadding: () => {
      if (deviceType === 'mobile') return 16;
      if (deviceType === 'tablet') return 24;
      return 32;
    },
  };
}