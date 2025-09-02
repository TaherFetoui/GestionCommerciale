import { StyleSheet } from 'react-native';
import { themes } from '../constants/AppConfig';

// Cette fonction génère les styles globaux en fonction du thème choisi
export const getGlobalStyles = (theme) => {
  const tTheme = themes[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: tTheme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: tTheme.background,
    },
    card: {
      backgroundColor: tTheme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: tTheme.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: tTheme.secondary,
      color: tTheme.text,
      borderWidth: 1,
      borderColor: tTheme.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 16,
    },
    primaryButton: {
      backgroundColor: tTheme.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      elevation: 2,
    },
    primaryButtonText: {
      color: tTheme.buttonText,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    fab: {
      position: 'absolute',
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      right: 20,
      bottom: 20,
      backgroundColor: tTheme.primary,
      borderRadius: 28,
      elevation: 8,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: tTheme.text,
    },
    listItemSubtitle: {
        fontSize: 14,
        color: tTheme.textSecondary,
        marginTop: 4,
    }
  });
};