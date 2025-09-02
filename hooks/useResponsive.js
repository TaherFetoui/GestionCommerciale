import { useWindowDimensions } from 'react-native';

const breakpoints = {
  mobile: 768,
  tablet: 1024,
};

export function useResponsive() {
  const { width } = useWindowDimensions();

  return {
    isMobile: width < breakpoints.mobile,
    isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
    isDesktop: width >= breakpoints.tablet,
  };
}