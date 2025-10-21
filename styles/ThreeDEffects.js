/**
 * Three.js Inspired 3D Effects and Animations
 * Modern styling utilities for depth, motion, and visual effects
 */

import { Animated, Easing } from 'react-native';
import { themes } from '../constants/AppConfig';

/**
 * Create a floating animation effect
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation}
 */
export const createFloatingAnimation = (animatedValue, duration = 2000) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Create a pulse animation (scale effect)
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation}
 */
export const createPulseAnimation = (animatedValue, duration = 1500) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.05,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Create a rotation animation
 * @param {Animated.Value} animatedValue - The animated value (0 to 1)
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation}
 */
export const createRotationAnimation = (animatedValue, duration = 3000) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Create a shimmer/loading animation
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation}
 */
export const createShimmerAnimation = (animatedValue, duration = 1200) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Create a spring bounce animation
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} toValue - Target value
 * @returns {Animated.CompositeAnimation}
 */
export const createSpringAnimation = (animatedValue, toValue = 1) => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Create a fade in animation
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation}
 */
export const createFadeInAnimation = (animatedValue, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: Easing.ease,
    useNativeDriver: true,
  });
};

/**
 * Create a slide in animation
 * @param {Animated.Value} animatedValue - The animated value to use
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation}
 */
export const createSlideInAnimation = (animatedValue, duration = 400) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

/**
 * 3D Transform utilities
 */
export const Transform3D = {
  /**
   * Create a perspective transform
   * @param {number} perspective - Perspective value
   */
  perspective: (perspective = 1000) => ({
    perspective,
  }),

  /**
   * Create a rotation transform
   * @param {Animated.Value} rotateValue - Animated rotation value (0-1)
   * @param {string} axis - Rotation axis ('X', 'Y', or 'Z')
   */
  rotate: (rotateValue, axis = 'Z') => {
    const rotation = rotateValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    return {
      [`rotate${axis}`]: rotation,
    };
  },

  /**
   * Create a tilt effect
   * @param {Animated.Value} tiltValue - Animated tilt value
   */
  tilt: (tiltValue) => ({
    rotateX: tiltValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '10deg'],
    }),
    rotateY: tiltValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-5deg'],
    }),
  }),
};

/**
 * Gradient configurations for modern UI
 */
export const GradientPresets = {
  primary: (theme) => {
    const tTheme = themes[theme];
    return {
      colors: tTheme.primaryGradient,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    };
  },
  
  accent: (theme) => {
    const tTheme = themes[theme];
    return {
      colors: tTheme.accentGradient,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    };
  },
  
  success: (theme) => {
    const tTheme = themes[theme];
    return {
      colors: tTheme.successGradient,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    };
  },
  
  danger: (theme) => {
    const tTheme = themes[theme];
    return {
      colors: tTheme.dangerGradient,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    };
  },
  
  background: (theme) => {
    const tTheme = themes[theme];
    return {
      colors: tTheme.backgroundGradient,
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    };
  },
  
  sidebar: (theme) => {
    const tTheme = themes[theme];
    return {
      colors: tTheme.sidebarBackgroundGradient,
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    };
  },
};

/**
 * Glassmorphism effect styles
 */
export const GlassmorphismStyles = {
  card: (theme) => {
    const tTheme = themes[theme];
    return {
      backgroundColor: tTheme.cardGlass,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
      ...tTheme.shadow.medium,
    };
  },
  
  panel: (theme) => {
    const tTheme = themes[theme];
    return {
      backgroundColor: tTheme.cardGlass,
      borderWidth: 1.5,
      borderColor: theme === 'light' 
        ? 'rgba(255, 255, 255, 0.25)' 
        : 'rgba(255, 255, 255, 0.1)',
      ...tTheme.shadow.large,
    };
  },
};

/**
 * Neumorphism effect styles
 */
export const NeumorphismStyles = {
  raised: (theme) => {
    const tTheme = themes[theme];
    return {
      backgroundColor: tTheme.card,
      shadowColor: theme === 'light' ? '#000' : '#FFF',
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: theme === 'light' ? 0.15 : 0.05,
      shadowRadius: 10,
      elevation: 5,
    };
  },
  
  pressed: (theme) => {
    const tTheme = themes[theme];
    return {
      backgroundColor: tTheme.card,
      shadowColor: theme === 'light' ? '#000' : '#FFF',
      shadowOffset: { width: -4, height: -4 },
      shadowOpacity: theme === 'light' ? 0.1 : 0.03,
      shadowRadius: 8,
      elevation: 2,
    };
  },
};

/**
 * Particle effect configuration
 */
export const ParticleConfig = {
  floatingParticles: {
    count: 20,
    sizeRange: [2, 8],
    speedRange: [0.5, 2],
    opacityRange: [0.1, 0.4],
  },
  
  shimmerParticles: {
    count: 30,
    sizeRange: [1, 4],
    speedRange: [1, 3],
    opacityRange: [0.2, 0.6],
  },
};

/**
 * Hover/Press state effects
 */
export const InteractionEffects = {
  scaleOnPress: (scale = 0.98) => ({
    transform: [{ scale }],
  }),
  
  elevateOnHover: (theme) => {
    const tTheme = themes[theme];
    return {
      ...tTheme.shadow.large,
      transform: [{ translateY: -2 }],
    };
  },
  
  glowOnActive: (theme) => {
    const tTheme = themes[theme];
    return {
      ...tTheme.shadow.glow,
    };
  },
};

export default {
  createFloatingAnimation,
  createPulseAnimation,
  createRotationAnimation,
  createShimmerAnimation,
  createSpringAnimation,
  createFadeInAnimation,
  createSlideInAnimation,
  Transform3D,
  GradientPresets,
  GlassmorphismStyles,
  NeumorphismStyles,
  ParticleConfig,
  InteractionEffects,
};
