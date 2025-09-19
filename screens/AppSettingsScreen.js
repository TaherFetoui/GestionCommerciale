import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes, translations } from '../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getGlobalStyles } from '../styles/GlobalStyles';

export default function AppSettingsScreen() {
    const { theme, toggleTheme, language, toggleLanguage } = useAuth();
    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];

    const currentLanguageName = {
        fr: 'Français',
        en: 'English',
        ar: 'العربية',
    };

    return (
        <View style={styles.container}>
            {/* Theme Setting Card */}
            <View style={styles.card}>
                <View style={styles.listItem}>
                    <View>
                        <Text style={styles.listItemTitle}>{t.switchTheme}</Text>
                        <Text style={styles.listItemSubtitle}>
                            {theme === 'light' ? 'Clair' : 'Sombre'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={localStyles.iconButton}>
                        <Ionicons 
                            name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} 
                            size={28} 
                            color={tTheme.primary} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Language Setting Card */}
            <View style={styles.card}>
                <View style={styles.listItem}>
                    <View>
                        <Text style={styles.listItemTitle}>{t.switchLanguage}</Text>
                        <Text style={styles.listItemSubtitle}>{currentLanguageName[language]}</Text>
                    </View>
                    <TouchableOpacity onPress={toggleLanguage} style={localStyles.iconButton}>
                        <Ionicons 
                            name="language-outline" 
                            size={28} 
                            color={tTheme.primary} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    iconButton: {
        padding: 8,
    }
});