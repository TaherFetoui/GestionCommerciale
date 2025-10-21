import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    ModernFilterChip,
    ModernSearchBar,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function StockMovementsScreen() {
    const navigation = useNavigation();
    const [movements, setMovements] = useState([]);
    const [filteredMovements, setFilteredMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stock_movements')
            .select('*, items(name, reference)')
            .order('created_at', { ascending: false });
        
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setMovements(data || []);
            setFilteredMovements(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchMovements();
        }, [fetchMovements])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMovements();
        setRefreshing(false);
    }, [fetchMovements]);

    // Filter movements based on search and type
    React.useEffect(() => {
        let result = movements;

        // Search filter
        if (searchQuery) {
            result = result.filter(
                (movement) =>
                    movement.items?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    movement.items?.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    movement.notes?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter((movement) => movement.movement_type === typeFilter);
        }

        setFilteredMovements(result);
    }, [searchQuery, typeFilter, movements]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMovementTypeIcon = (type) => {
        return type === 'in' ? 'arrow-down' : 'arrow-up';
    };

    const getMovementTypeColor = (type) => {
        return type === 'in' ? tTheme.success : tTheme.error;
    };

    const getReferenceTypeLabel = (refType) => {
        switch (refType) {
            case 'purchase':
                return 'Achat';
            case 'sale':
                return 'Vente';
            case 'adjustment':
                return 'Ajustement';
            case 'return':
                return 'Retour';
            default:
                return refType || 'N/A';
        }
    };

    const tableColumns = [
        {
            key: 'date',
            label: 'Date',
            flex: 1.5,
            render: (row) => (
                <Text style={[localStyles.dateText, { color: tTheme.textSecondary }]} numberOfLines={2}>
                    {formatDate(row.created_at)}
                </Text>
            ),
        },
        {
            key: 'item',
            label: 'Article',
            flex: 2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.itemName, { color: tTheme.text }]} numberOfLines={1}>
                        {row.items?.name || 'N/A'}
                    </Text>
                    {row.items?.reference && (
                        <Text style={[localStyles.itemRef, { color: tTheme.textSecondary }]} numberOfLines={1}>
                            Réf: {row.items.reference}
                        </Text>
                    )}
                </View>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            flex: 1.2,
            render: (row) => (
                <View style={localStyles.typeContainer}>
                    <Ionicons 
                        name={getMovementTypeIcon(row.movement_type)} 
                        size={20} 
                        color={getMovementTypeColor(row.movement_type)} 
                    />
                    <Text style={[
                        localStyles.typeText,
                        { color: getMovementTypeColor(row.movement_type) }
                    ]}>
                        {row.movement_type === 'in' ? 'Entrée' : 'Sortie'}
                    </Text>
                </View>
            ),
        },
        {
            key: 'quantity',
            label: 'Qté',
            flex: 0.8,
            render: (row) => (
                <Text style={[
                    localStyles.quantity,
                    { color: getMovementTypeColor(row.movement_type) }
                ]}>
                    {row.movement_type === 'in' ? '+' : '-'}{row.quantity}
                </Text>
            ),
        },
        {
            key: 'reference',
            label: 'Référence',
            flex: 1.2,
            render: (row) => (
                <View style={[localStyles.referenceBadge, { backgroundColor: tTheme.primarySoft }]}>
                    <Text style={[localStyles.referenceText, { color: tTheme.primary }]} numberOfLines={1}>
                        {getReferenceTypeLabel(row.reference_type)}
                    </Text>
                </View>
            ),
        },
        {
            key: 'notes',
            label: 'Notes',
            flex: 2,
            render: (row) => (
                <Text style={[localStyles.notesText, { color: tTheme.textSecondary }]} numberOfLines={2}>
                    {row.notes || '-'}
                </Text>
            ),
        },
    ];

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'in', label: 'Entrées' },
        { value: 'out', label: 'Sorties' },
    ];

    // Calculate statistics
    const totalIn = movements
        .filter(m => m.movement_type === 'in')
        .reduce((sum, m) => sum + (m.quantity || 0), 0);
    
    const totalOut = movements
        .filter(m => m.movement_type === 'out')
        .reduce((sum, m) => sum + (m.quantity || 0), 0);

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                {/* Statistics Cards */}
                <View style={localStyles.statsContainer}>
                    <View style={[localStyles.statCard, { backgroundColor: tTheme.card, borderLeftColor: tTheme.success }]}>
                        <View style={localStyles.statHeader}>
                            <Ionicons name="arrow-down" size={24} color={tTheme.success} />
                            <Text style={[localStyles.statValue, { color: tTheme.success }]}>
                                +{totalIn}
                            </Text>
                        </View>
                        <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                            Total Entrées
                        </Text>
                    </View>

                    <View style={[localStyles.statCard, { backgroundColor: tTheme.card, borderLeftColor: tTheme.error }]}>
                        <View style={localStyles.statHeader}>
                            <Ionicons name="arrow-up" size={24} color={tTheme.error} />
                            <Text style={[localStyles.statValue, { color: tTheme.error }]}>
                                -{totalOut}
                            </Text>
                        </View>
                        <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                            Total Sorties
                        </Text>
                    </View>

                    <View style={[localStyles.statCard, { backgroundColor: tTheme.card, borderLeftColor: tTheme.primary }]}>
                        <View style={localStyles.statHeader}>
                            <Ionicons name="swap-horizontal" size={24} color={tTheme.primary} />
                            <Text style={[localStyles.statValue, { color: tTheme.primary }]}>
                                {movements.length}
                            </Text>
                        </View>
                        <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                            Total Mouvements
                        </Text>
                    </View>
                </View>

                {/* Search and Filters */}
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher un mouvement..."
                        theme={theme}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChipsContainer}>
                        {filterOptions.map((filter) => (
                            <ModernFilterChip
                                key={filter.value}
                                label={filter.label}
                                active={typeFilter === filter.value}
                                onPress={() => setTypeFilter(filter.value)}
                                theme={theme}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Movements Table */}
                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredMovements}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun mouvement de stock enregistré."
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
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
    dateText: {
        fontSize: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    itemRef: {
        fontSize: 11,
        marginTop: 2,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    quantity: {
        fontSize: 15,
        fontWeight: '700',
    },
    referenceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    referenceText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    notesText: {
        fontSize: 12,
    },
});
