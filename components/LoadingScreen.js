import { themes } from '@constants/AppConfig';
import { useAuth } from '@context/AuthContext';
import { PlatformUtils } from '@hooks/usePlatform';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

/**
 * Enhanced loading component with platform-specific optimizations
 */
const LoadingScreen = ({ size = 'large', text = null }) => {
  const { theme } = useAuth();
  const tTheme = themes[theme];

  const containerStyle = [
    styles.container,
    { backgroundColor: tTheme.background },
    PlatformUtils.getStyles(
      { minHeight: '100vh' }, // Web
      { flex: 1 }, // Mobile
      { flex: 1 } // Android
    )
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={size} 
        color={tTheme.primary} 
        style={styles.indicator}
      />
      {text && (
        <Text style={[styles.text, { color: tTheme.textSecondary }]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingScreen;