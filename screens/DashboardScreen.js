import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { themes, translations } from '../constants/AppConfig';
import { getGlobalStyles } from '../styles/GlobalStyles';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

// Composant pour les cartes de statistiques
const StatCard = React.memo(({ title, value, icon, color, currency = '' }) => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.statCard]}>
            <View style={[localStyles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <View>
                <Text style={[localStyles.statTitle, { color: tTheme.textSecondary }]}>{title}</Text>
                <Text style={[localStyles.statValue, { color: tTheme.text }]}>{value} {currency}</Text>
            </View>
        </View>
    );
});

// Composant pour le graphique (placeholder)
const PerformanceChart = React.memo(() => {
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
});

export default function DashboardScreen() {
    const { theme, language } = useAuth();
    const styles = getGlobalStyles(theme);
    const t = translations[language];

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- Data Fetching Logic ---
    const fetchStats = useCallback(async () => {
        const { data, error } = await supabase.rpc('get_dashboard_stats');
        
        if (error) {
            Alert.alert(t.error, "Impossible de charger les statistiques du tableau de bord.");
            console.error(error);
        } else if (data) {
            setStats(data[0]);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchStats();
        }, [fetchStats])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats().then(() => setRefreshing(false));
    }, [fetchStats]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={themes[theme].primary} /></View>;
    }

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={localStyles.statsGrid}>
                <StatCard 
                    title="Chiffre d'affaire (Mois)" 
                    value={stats?.total_revenue_month?.toFixed(3) || '0.000'} 
                    currency="TND"
                    icon="trending-up-outline" 
                    color="#3B82F6" 
                />
                <StatCard 
                    title="Commandes en cours" 
                    value={stats?.open_orders_count || '0'} 
                    icon="cube-outline" 
                    color="#F59E0B" 
                />
                <StatCard 
                    title="Nouveaux clients (Mois)" 
                    value={stats?.new_clients_month || '0'} 
                    icon="person-add-outline" 
                    color="#10B981" 
                />
                <StatCard 
                    title="Factures impayées" 
                    value={stats?.unpaid_invoices_count || '0'} 
                    icon="alert-circle-outline" 
                    color="#EF4444" 
                />
            </View>
            <PerformanceChart />
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 8,
        flexGrow: 1,
        minWidth: 250,
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