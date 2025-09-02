import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes } from '../constants/AppConfig';
import { getGlobalStyles } from '../styles/GlobalStyles';
import Ionicons from '@expo/vector-icons/Ionicons';

// Composant pour les cartes de statistiques
const StatCard = ({ title, value, icon, color }) => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.statCard]}>
            <View style={[localStyles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <View>
                <Text style={[localStyles.statTitle, { color: tTheme.textSecondary }]}>{title}</Text>
                <Text style={[localStyles.statValue, { color: tTheme.text }]}>{value}</Text>
            </View>
        </View>
    );
};

// Composant pour le graphique (placeholder)
const PerformanceChart = () => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, { flex: 1, minHeight: 400 }]}>
            <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>Rapport des performances</Text>
            <View style={localStyles.chartPlaceholder}>
                <Ionicons name="analytics-outline" size={80} color={tTheme.border} />
                <Text style={{color: tTheme.textSecondary, marginTop: 16}}>Les graphiques de performance seront affichés ici</Text>
            </View>
        </View>
    );
};

export default function DashboardScreen() {
    const { theme } = useAuth();
    const styles = getGlobalStyles(theme);

    return (
        <ScrollView style={styles.container}>
            <View style={localStyles.statsGrid}>
                <StatCard title="Chiffre d'affaire (Mois)" value="12,500 TND" icon="trending-up-outline" color="#3B82F6" />
                <StatCard title="Commandes en cours" value="8" icon="cube-outline" color="#F59E0B" />
                <StatCard title="Nouveaux clients" value="4" icon="person-add-outline" color="#10B981" />
                <StatCard title="Factures impayées" value="3" icon="alert-circle-outline" color="#EF4444" />
            </View>
            <PerformanceChart />
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8, // Compense le padding des cartes
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 8,
        flexGrow: 1,
        minWidth: 250, // Permet 2 à 4 cartes par ligne
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    statTitle: {
        fontSize: 14,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    chartPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});