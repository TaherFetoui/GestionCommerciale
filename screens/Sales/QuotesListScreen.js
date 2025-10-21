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

export default function QuotesListScreen() {
    const navigation = useNavigation();
    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchQuotes = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('quotes').select('*, clients (name)').order('created_at', { ascending: false });
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setQuotes(data || []);
            setFilteredQuotes(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchQuotes();
        }, [fetchQuotes])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateQuote')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau devis</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchQuotes();
        setRefreshing(false);
    }, [fetchQuotes]);

    // Filter quotes based on search and status
    React.useEffect(() => {
        let result = quotes;

        if (searchQuery) {
            result = result.filter(
                (quote) =>
                    quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    quote.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter((quote) => quote.status === statusFilter);
        }

        setFilteredQuotes(result);
    }, [searchQuery, statusFilter, quotes]);

    const tableColumns = [
        {
            key: 'quote_number',
            label: 'N° Devis',
            flex: 1.2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.quoteNumber, { color: tTheme.primary }]} numberOfLines={1}>
                        {row.quote_number}
                    </Text>
                    <Text style={[localStyles.quoteDate, { color: tTheme.textSecondary }]}>
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
        { value: 'draft', label: 'Brouillon' },
        { value: 'sent', label: 'Envoyé' },
        { value: 'accepted', label: 'Accepté' },
        { value: 'rejected', label: 'Refusé' },
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
                        placeholder="Rechercher un devis..."
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
                        data={filteredQuotes}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun devis trouvé. Créez votre premier devis."
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
    quoteNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    quoteDate: {
        fontSize: 12,
    },
    amount: {
        fontSize: 15,
        fontWeight: '700',
    },
});