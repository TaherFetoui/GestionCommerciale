import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { themes } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CashBoxesScreen() {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    const styles = getGlobalStyles(theme);

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <View style={[localStyles.comingSoon, { backgroundColor: tTheme.card }]}>
                <Ionicons name="cash-outline" size={64} color={tTheme.primary} />
                <Text style={[localStyles.title, { color: tTheme.text }]}>Caisses enregistreuses</Text>
                <Text style={[localStyles.description, { color: tTheme.textSecondary }]}>
                    Gestion multi-caisses avec suivi des fonds et rapports de caisse.
                </Text>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    comingSoon: { flex: 1, margin: 16, borderRadius: 24, padding: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: '700', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    description: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
