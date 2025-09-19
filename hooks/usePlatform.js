import { Platform } from 'react-native';

/**
 * Platform-specific utilities and optimizations
 */
export const PlatformUtils = {
  // Check if running on web
  isWeb: Platform.OS === 'web',
  
  // Check if running on Android
  isAndroid: Platform.OS === 'android',
  
  // Check if running on iOS
  isIOS: Platform.OS === 'ios',
  
  // Get platform-specific styles
  getStyles: (webStyles = {}, mobileStyles = {}, androidStyles = {}) => {
    if (Platform.OS === 'web') {
      return { ...mobileStyles, ...webStyles };
    }
    if (Platform.OS === 'android') {
      return { ...mobileStyles, ...androidStyles };
    }
    return mobileStyles;
  },
  
  // Get platform-specific components or props
  select: Platform.select,
  
  // Optimized shadow for different platforms
  getShadow: (elevation = 3) => Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
    },
    android: {
      elevation,
    },
    web: {
      boxShadow: `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)`,
    },
  }),
  
  // Platform-specific text selection
  getTextSelectionProps: () => Platform.select({
    web: {
      selectable: true,
      dataDetectorType: 'none',
    },
    default: {
      selectable: false,
    },
  }),
  
  // Platform-specific keyboard behavior
  getKeyboardAvoidingBehavior: () => Platform.select({
    ios: 'padding',
    android: 'height',
    web: undefined,
  }),
  
  // Platform-specific haptic feedback
  hapticFeedback: {
    light: () => {
      if (Platform.OS === 'ios') {
        // iOS haptic feedback would be implemented here
        // Requires expo-haptics or react-native-haptic-feedback
      }
    },
    medium: () => {
      if (Platform.OS === 'ios') {
        // iOS haptic feedback would be implemented here
      }
    },
    heavy: () => {
      if (Platform.OS === 'ios') {
        // iOS haptic feedback would be implemented here
      }
    },
  },
  
  // Platform-specific navigation bar height
  getStatusBarHeight: () => Platform.select({
    ios: 44,
    android: 24,
    web: 0,
  }),
  
  // Platform-specific safe area
  getSafeAreaInsets: () => Platform.select({
    ios: { top: 44, bottom: 34 },
    android: { top: 24, bottom: 0 },
    web: { top: 0, bottom: 0 },
  }),
};