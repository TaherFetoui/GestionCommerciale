import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes } from '../constants/AppConfig';
import { getGlobalStyles } from '../styles/GlobalStyles';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function PlaceholderScreen({ title }) {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    const styles = getGlobalStyles(theme);

    return (
        <View style={styles.centered}>
            <Ionicons name="construct-outline" size={60} color={tTheme.textSecondary} />
            <Text style={[localStyles.title, { color: tTheme.text }]}>{title}</Text>
            <Text style={[localStyles.subtitle, { color: tTheme.textSecondary }]}>Ce module est en cours de construction.</Text>
        </View>
    );
}

const localStyles = StyleSheet.create({
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
    }
});