import { StyleSheet } from 'react-native';
import { themes } from '../constants/AppConfig';

// Modern 3D styling utilities inspired by Three.js aesthetics
const create3DEffect = (color, intensity = 1) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 * intensity },
  shadowOpacity: 0.15 * intensity,
  shadowRadius: 8 * intensity,
  elevation: 4 * intensity,
});

const createGlowEffect = (color, intensity = 1) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5 * intensity,
  shadowRadius: 20 * intensity,
  elevation: 10 * intensity,
});

const createGlassmorphism = (backgroundColor, blur = 20) => ({
  backgroundColor,
  backdropFilter: `blur(${blur}px)`, // Web only
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.18)',
});

// Cette fonction génère les styles globaux en fonction du thème choisi avec effets 3D
export const getGlobalStyles = (theme) => {
  const tTheme = themes[theme];

  return StyleSheet.create({
    // Base container with gradient support
    container: {
      flex: 1,
      backgroundColor: tTheme.background,
      width: '100%',
      maxWidth: '100%',
    },
    containerPadded: {
      flex: 1,
      padding: 16,
      backgroundColor: tTheme.background,
      width: '100%',
      maxWidth: '100%',
    },
    containerGradient: {
      flex: 1,
      width: '100%',
      maxWidth: '100%',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: tTheme.background,
      padding: 16,
      width: '100%',
      maxWidth: '100%',
    },
    
    // Scrollable content wrapper
    scrollContent: {
      flexGrow: 1,
      width: '100%',
      maxWidth: '100%',
    },
    
    // Modern 3D Card styles
    card: {
      backgroundColor: tTheme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      ...tTheme.shadow.medium,
      borderWidth: 1,
      borderColor: tTheme.borderLight,
      width: '100%',
      maxWidth: '100%',
    },
    cardElevated: {
      backgroundColor: tTheme.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      ...tTheme.shadow.large,
      borderWidth: 1,
      borderColor: tTheme.borderLight,
      width: '100%',
      maxWidth: '100%',
    },
    cardGlass: {
      backgroundColor: tTheme.cardGlass,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      ...tTheme.shadow.medium,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
    },
    cardFlat: {
      backgroundColor: tTheme.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: tTheme.border,
      width: '100%',
      maxWidth: '100%',
    },
    
    // Labels with modern typography
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: tTheme.text,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    labelLarge: {
      fontSize: 18,
      fontWeight: '700',
      color: tTheme.text,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    labelSecondary: {
      fontSize: 14,
      fontWeight: '500',
      color: tTheme.textSecondary,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    
    // Modern 3D Input styles
    input: {
      backgroundColor: tTheme.card,
      color: tTheme.text,
      borderWidth: 2,
      borderColor: tTheme.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      marginBottom: 16,
      ...tTheme.shadow.small,
      transition: 'all 0.3s ease',
    },
    inputFocused: {
      borderColor: tTheme.primary,
      ...tTheme.shadow.medium,
      transform: [{ scale: 1.01 }],
    },
    inputGlass: {
      backgroundColor: tTheme.cardGlass,
      color: tTheme.text,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontSize: 16,
      marginBottom: 16,
      ...tTheme.shadow.small,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
      paddingTop: 14,
    },
    
    // Modern 3D Buttons with gradients
    primaryButton: {
      backgroundColor: tTheme.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...tTheme.shadow.medium,
      borderWidth: 0,
    },
    primaryButtonGradient: {
      // Would use LinearGradient component in implementation
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...tTheme.shadow.large,
    },
    primaryButtonGlow: {
      backgroundColor: tTheme.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...tTheme.shadow.glow,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: 2,
      borderColor: tTheme.primary,
    },
    primaryButtonText: {
      color: tTheme.buttonText,
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 8,
      letterSpacing: 0.5,
    },
    
    // Floating Action Button with 3D effect
    fab: {
      position: 'absolute',
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      right: 24,
      bottom: 24,
      backgroundColor: tTheme.primary,
      borderRadius: 32,
      ...tTheme.shadow.large,
    },
    fabGlow: {
      position: 'absolute',
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      right: 24,
      bottom: 24,
      backgroundColor: tTheme.primary,
      borderRadius: 32,
      ...tTheme.shadow.glow,
    },
    
    // Modern List Items with depth
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: tTheme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      ...tTheme.shadow.small,
      borderLeftWidth: 4,
      borderLeftColor: tTheme.primary,
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: tTheme.text,
      letterSpacing: 0.3,
    },
    listItemSubtitle: {
      fontSize: 14,
      color: tTheme.textSecondary,
      marginTop: 4,
      letterSpacing: 0.2,
    },
    
    // Dividers and separators
    divider: {
      height: 1,
      backgroundColor: tTheme.divider,
      marginVertical: 16,
    },
    dividerThick: {
      height: 2,
      backgroundColor: tTheme.border,
      marginVertical: 20,
    },
    
    // Badge components
    badge: {
      backgroundColor: tTheme.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      ...tTheme.shadow.small,
    },
    badgeText: {
      color: tTheme.buttonText,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    
    // Status indicators
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    statusDotGlow: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
      ...createGlowEffect(tTheme.primary, 0.5),
    },
    
    // Shimmer effect container
    shimmer: {
      backgroundColor: tTheme.shimmer,
      overflow: 'hidden',
    },
    
    // Overlay for modals
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: tTheme.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // Panel with depth
    panel: {
      backgroundColor: tTheme.card,
      borderRadius: 16,
      padding: 20,
      ...tTheme.shadow.medium,
      marginBottom: 16,
    },
    panelHeader: {
      fontSize: 18,
      fontWeight: '700',
      color: tTheme.text,
      marginBottom: 16,
      letterSpacing: 0.5,
    },
  });
};

// Export utility functions for custom 3D effects
export const ThreeDUtils = {
  create3DEffect,
  createGlowEffect,
  createGlassmorphism,
};