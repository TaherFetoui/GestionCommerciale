import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function InvoicesListScreen({ navigation }) {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('invoices')
            .select('*, clients (name)')
            .order('issue_date', { ascending: false });
        
        if (error) {
            console.error('Error fetching invoices:', error);
        } else {
            setInvoices(data || []);
            setFilteredInvoices(data || []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
        }, [fetchInvoices])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateInvoice')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouvelle facture</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchInvoices();
        setRefreshing(false);
    }, [fetchInvoices]);

    // Filter invoices based on search and status
    React.useEffect(() => {
        let result = invoices;

        // Filter by search query
        if (searchQuery) {
            result = result.filter(inv =>
                inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(inv => inv.status === statusFilter);
        }

        setFilteredInvoices(result);
    }, [searchQuery, statusFilter, invoices]);

    const tableColumns = [
        {
            key: 'invoice_number',
            label: 'N° Facture',
            flex: 1.2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.invoiceNumber, { color: tTheme.primary }]} numberOfLines={1}>
                        {row.invoice_number}
                    </Text>
                    <Text style={[localStyles.invoiceDate, { color: tTheme.textSecondary }]}>
                        {new Date(row.issue_date).toLocaleDateString('fr-FR')}
                    </Text>
                </View>
            ),
        },
        {
            key: 'client',
            label: 'Client',
            flex: 1.5,
            render: (row) => (
                <Text style={{ color: tTheme.text, fontWeight: '500' }} numberOfLines={1}>
                    {row.clients?.name || 'N/A'}
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
        { value: 'paid', label: 'Payé' },
        { value: 'awaiting_payment', label: 'En attente' },
        { value: 'overdue', label: 'En retard' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                {/* Search and Filters */}
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher une facture..."
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

                {/* Modern Table */}
                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredInvoices}
                        columns={tableColumns}
                        onRowPress={(invoice) => navigation.navigate('InvoiceDetail', { invoice_id: invoice.id })}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucune facture trouvée. Créez votre première facture."
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
    invoiceNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    invoiceDate: {
        fontSize: 12,
    },
    amount: {
        fontSize: 15,
        fontWeight: '700',
    },
});