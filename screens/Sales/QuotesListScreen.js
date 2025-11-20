import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);
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

    const confirmDeleteQuote = useCallback(async () => {
        if (!quoteToDelete) return;
        
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('quotes')
                .delete()
                .eq('id', quoteToDelete.id);

            if (error) {
                Alert.alert(t.error, error.message);
            } else {
                setQuotes(prev => prev.filter(quote => quote.id !== quoteToDelete.id));
                Alert.alert('✓ Succès', 'Devis supprimé avec succès');
            }
        } catch (error) {
            Alert.alert(t.error, 'Impossible de supprimer le devis');
        }
        
        setQuoteToDelete(null);
    }, [quoteToDelete, t.error]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setQuoteToDelete(null);
    }, []);

    const handlePrintQuote = useCallback((quote) => {
        Alert.alert('Impression', `Impression du devis ${quote.quote_number}`);
    }, []);

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
        {
            key: 'actions',
            label: 'Actions',
            flex: 1,
            render: (row) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            handlePrintQuote(row);
                        }}
                    >
                        <Ionicons name="print-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { 
                            backgroundColor: '#FEE2E2',
                            borderColor: '#EF4444'
                        }]}
                        onPress={(e) => {
                            if (e && e.stopPropagation) {
                                e.stopPropagation();
                            }
                            setQuoteToDelete(row);
                            setDeleteModalVisible(true);
                        }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            ),
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

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelDelete}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>
                        <Text style={[localStyles.deleteModalTitle, { color: tTheme.text }]}>
                            Supprimer le devis
                        </Text>
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Voulez-vous vraiment supprimer le devis{'\n'}
                            <Text style={{ fontWeight: 'bold', color: tTheme.primary }}>
                                {quoteToDelete?.quote_number}
                            </Text>
                            {'\n\n'}
                            <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                                Cette action est irréversible.
                            </Text>
                        </Text>
                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.cancelButton, { backgroundColor: tTheme.border }]}
                                onPress={cancelDelete}
                                activeOpacity={0.7}
                            >
                                <Text style={[localStyles.modalButtonText, { color: tTheme.text }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[localStyles.modalButton, { backgroundColor: '#DC2626' }]}
                                onPress={confirmDeleteQuote}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={18} color="#FFFFFF" />
                                <Text style={[localStyles.modalButtonText, { color: '#FFFFFF', marginLeft: 6 }]}>
                                    Supprimer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});