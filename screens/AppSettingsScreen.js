import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ModernInfoCard } from '../components/ModernUIComponents';
import { themes, translations } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
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
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView contentContainerStyle={localStyles.scrollContent}>
                {/* Theme Setting Card */}
                <ModernInfoCard
                    title={t.switchTheme}
                    value={theme === 'light' ? 'Clair' : 'Sombre'}
                    icon={theme === 'light' ? 'moon-outline' : 'sunny-outline'}
                    theme={theme}
                    onPress={toggleTheme}
                />

                {/* Language Setting Card */}
                <ModernInfoCard
                    title={t.switchLanguage}
                    value={currentLanguageName[language]}
                    icon="language-outline"
                    theme={theme}
                    onPress={toggleLanguage}
                />

                {/* App Information */}
                <View style={[styles.card, localStyles.infoSection]}>
                    <Text style={[localStyles.infoTitle, { color: tTheme.text }]}>
                        À propos de l'application
                    </Text>
                    <View style={localStyles.infoRow}>
                        <Text style={[localStyles.infoLabel, { color: tTheme.textSecondary }]}>
                            Version
                        </Text>
                        <Text style={[localStyles.infoValue, { color: tTheme.text }]}>
                            1.0.0
                        </Text>
                    </View>
                    <View style={localStyles.infoRow}>
                        <Text style={[localStyles.infoLabel, { color: tTheme.textSecondary }]}>
                            Développeur
                        </Text>
                        <Text style={[localStyles.infoValue, { color: tTheme.text }]}>
                            Taher Fetoui
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    infoSection: {
        marginTop: 20,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 15,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
    },
});