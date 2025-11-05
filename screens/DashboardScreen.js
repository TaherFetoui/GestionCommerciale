import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { themes, translations } from '../constants/AppConfig';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { supabase } from '../lib/supabase';
import { getGlobalStyles } from '../styles/GlobalStyles';

// Composant pour les cartes de statistiques
const StatCard = React.memo(({ title, value, icon, color, currency = '' }) => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    const { isMobile } = useResponsive();
    
    return (
        <View style={[
            getGlobalStyles(theme).card, 
            localStyles.statCard,
            isMobile && localStyles.statCardMobile
        ]}>
            <View style={[localStyles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <View style={localStyles.statContent}>
                <Text style={[localStyles.statTitle, { color: tTheme.textSecondary }]} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={[localStyles.statValue, { color: tTheme.text }]} numberOfLines={1}>
                    {value} {currency}
                </Text>
            </View>
        </View>
    );
});

// Composant pour le graphique (placeholder)
const PerformanceChart = React.memo(() => {
    const { theme } = useAuth();
    const tTheme = themes[theme];
    return (
        <View style={[getGlobalStyles(theme).card, localStyles.chartContainer]}>
            <Text style={[localStyles.chartTitle, { color: tTheme.text }]}>Rapport des performances</Text>
            <View style={localStyles.chartPlaceholder}>
                <Ionicons name="analytics-outline" size={80} color={tTheme.border} />
                <Text style={{color: tTheme.textSecondary, marginTop: 16, textAlign: 'center', paddingHorizontal: 16}}>
                    Les graphiques de performance seront affichés ici
                </Text>
            </View>
        </View>
    );
});

export default function DashboardScreen() {
    const { theme, language } = useAuth();
    const { getContentPadding, getColumns, isMobile } = useResponsive();
    const styles = getGlobalStyles(theme);
    const t = translations[language];

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- Data Fetching Logic ---
    const fetchStats = useCallback(async () => {
        const { data, error } = await supabase.rpc('get_dashboard_stats');
        
        if (error) {
            Alert.alert(t.error, t.loadingDashboard);
            console.error(error);
        } else if (data) {
            setStats(data[0]);
        }
        setLoading(false);
    }, [t.error, t.loadingDashboard]);

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

    const contentPadding = getContentPadding();

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={{ padding: contentPadding }}
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
        marginBottom: 12,
    },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 8,
        flex: 1,
        minWidth: 280,
        maxWidth: '100%',
    },
    statCardMobile: {
        minWidth: '100%',
        maxWidth: '100%',
        flex: 0,
        flexBasis: 'auto',
    },
    statContent: {
        flex: 1,
        minWidth: 0,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        flexShrink: 0,
    },
    statTitle: {
        fontSize: 13,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    chartContainer: {
        marginTop: 8,
        minHeight: 320,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    chartPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 260,
        paddingVertical: 40,
    },
});