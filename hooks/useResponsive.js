import { useEffect, useState } from 'react';
import { Dimensions, useWindowDimensions } from 'react-native';

const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  large: 1920,
};

export function useResponsive() {
  const dimensions = useWindowDimensions();
  const width = dimensions?.width || Dimensions.get('window').width;
  const height = dimensions?.height || Dimensions.get('window').height;
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

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop' || deviceType === 'large';
  const isLarge = deviceType === 'large';

  return {
    width,
    height,
    orientation,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    
    // Utility functions for responsive design
    getColumns: () => {
      if (isMobile) return 1;
      if (isTablet) return 2;
      if (width < breakpoints.large) return 3;
      if (width < 2400) return 4;
      return 5;
    },
    
    getSidebarWidth: () => {
      if (isMobile) return '100%'; // Full width on mobile
      if (isTablet) return 240;
      if (width < breakpoints.large) return 260;
      return 280;
    },
    
    getContentPadding: () => {
      if (isMobile) return 12;
      if (isTablet) return 16;
      if (width < breakpoints.large) return 20;
      return 24;
    },
    
    getCardMinWidth: () => {
      if (isMobile) return '100%';
      if (isTablet) return 200;
      if (width < breakpoints.large) return 240;
      return 260;
    },
    
    getSpacing: () => {
      if (isMobile) return 8;
      if (isTablet) return 12;
      if (width < breakpoints.large) return 16;
      return 20;
    },
    
    getHeaderHeight: () => {
      return isMobile ? 56 : 64;
    },
    
    getFontSize: (base = 16) => {
      if (isMobile) return base - 2;
      if (isTablet) return base;
      return base + 2;
    },
  };
}