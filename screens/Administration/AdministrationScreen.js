import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import { getGlobalStyles } from '../../styles/GlobalStyles';
import Ionicons from '@expo/vector-icons/Ionicons';

// Widget réutilisable pour les cartes du menu
const AdminWidget = ({ title, description, icon, onPress, theme }) => {
    const tTheme = themes[theme];
    const styles = getGlobalStyles(theme);
    return (
        <TouchableOpacity style={[styles.card, localStyles.widget]} onPress={onPress}>
            <Ionicons name={icon} size={40} color={tTheme.primary} />
            <Text style={[localStyles.widgetTitle, { color: tTheme.text }]}>{title}</Text>
            <Text style={[localStyles.widgetDescription, { color: tTheme.textSecondary }]}>{description}</Text>
        </TouchableOpacity>
    );
};

export default function AdministrationScreen() {
    const navigation = useNavigation();
    const { theme, language } = useAuth();
    const styles = getGlobalStyles(theme);
    const t = translations[language];

    return (
        <View style={styles.container}>
            <View style={localStyles.widgetContainer}>
                <AdminWidget
                    title={t.clients}
                    description="Ajouter, modifier ou consulter vos clients"
                    icon="people-outline"
                    theme={theme}
                    onPress={() => navigation.navigate('ClientsList')}
                />
                <AdminWidget
                    title={t.suppliers}
                    description="Ajouter, modifier ou consulter vos fournisseurs"
                    icon="business-outline"
                    theme={theme}
                    onPress={() => navigation.navigate('SuppliersList')}
                />
            </View>
            {/* Vous pourrez ajouter d'autres widgets pour les Articles, etc. ici */}
        </View>
    );
}

const localStyles = StyleSheet.create({
    widgetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    widget: {
        flexGrow: 1,
        marginHorizontal: 8,
        minWidth: 250,
        alignItems: 'center',
        paddingVertical: 32,
    },
    widgetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    widgetDescription: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
});