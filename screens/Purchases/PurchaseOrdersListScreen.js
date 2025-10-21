import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function PurchaseOrdersListScreen() {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('purchase_orders').select('*, suppliers (name)').order('order_date', { ascending: false });
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setOrders(data || []);
            setFilteredOrders(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreatePurchaseOrder')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouvelle commande</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    // Filter orders based on search and status
    React.useEffect(() => {
        let result = orders;

        if (searchQuery) {
            result = result.filter(
                (order) =>
                    order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    order.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter((order) => order.status === statusFilter);
        }

        setFilteredOrders(result);
    }, [searchQuery, statusFilter, orders]);

    const tableColumns = [
        {
            key: 'order_number',
            label: 'N° Commande',
            flex: 1.2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.orderNumber, { color: tTheme.primary }]} numberOfLines={1}>
                        {row.order_number}
                    </Text>
                    <Text style={[localStyles.orderDate, { color: tTheme.textSecondary }]}>
                        {new Date(row.order_date).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
            ),
        },
        {
            key: 'supplier',
            label: 'Fournisseur',
            flex: 1.5,
            render: (row) => (
                <Text style={{ color: tTheme.text, fontWeight: '500' }} numberOfLines={1}>
                    {row.suppliers?.name || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'total_amount',
            label: 'Montant',
            flex: 1,
            render: (row) => (
                <Text style={[localStyles.amount, { color: tTheme.text }]}>
                    {row.total_amount?.toFixed(3) || '0.000'} TND
                </Text>
            ),
        },
        {
            key: 'status',
            label: 'Statut',
            flex: 1,
            render: (row) => <ModernStatusBadge status={row.status} theme={theme} />,
        },
    ];

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'pending', label: 'En attente' },
        { value: 'confirmed', label: 'Confirmé' },
        { value: 'received', label: 'Reçu' },
        { value: 'cancelled', label: 'Annulé' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher une commande..."
                        theme={theme}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChipsContainer}>
                        {filterOptions.map((filter) => (
                            <ModernFilterChip
                                key={filter.value}
                                label={filter.label}
                                active={statusFilter === filter.value}
                                onPress={() => setStatusFilter(filter.value)}
                                theme={theme}
                            />
                        ))}
                    </ScrollView>
                </View>

                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredOrders}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucune commande trouvée. Créez votre première commande d'achat."
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    headerButton: {
        marginRight: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    scrollContent: {
        padding: 20,
    },
    filtersContainer: {
        marginBottom: 20,
        gap: 12,
    },
    filterChipsContainer: {
        marginTop: 4,
    },
    tableWrapper: {
        marginBottom: 20,
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 12,
    },
    amount: {
        fontSize: 15,
        fontWeight: '700',
    },
});