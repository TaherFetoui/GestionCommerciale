import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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

export default function DeliveryNotesListScreen() {
    const navigation = useNavigation();
    const [deliveryNotes, setDeliveryNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    
    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const fetchDeliveryNotes = useCallback(async () => {
        setLoading(true);
        
        let { data, error } = await supabase
            .from('delivery_notes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (data && data.length > 0) {
            const clientIds = [...new Set(data.map(o => o.client_id).filter(Boolean))];
            
            if (clientIds.length > 0) {
                const { data: clientsData, error: clientsError } = await supabase
                    .from('clients')
                    .select('id, name')
                    .in('id', clientIds);
                
                if (clientsError) {
                    console.error('Error fetching clients:', clientsError);
                }
                
                if (clientsData) {
                    data = data.map(note => ({
                        ...note,
                        clients: clientsData.find(c => c.id === note.client_id) || null
                    }));
                }
            }
        }
            
        if (error) {
            console.error('Error fetching delivery notes:', error);
            Alert.alert('Erreur', error.message || 'Impossible de charger les bons de livraison');
        } else {
            setDeliveryNotes(data || []);
            setFilteredNotes(data || []);
        }
        setLoading(false);
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchDeliveryNotes();
        }, [fetchDeliveryNotes])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateDeliveryNote')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau bon</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDeliveryNotes();
        setRefreshing(false);
    }, [fetchDeliveryNotes]);

    React.useEffect(() => {
        let result = deliveryNotes;

        if (searchQuery) {
            result = result.filter(note =>
                note.note_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(note => note.status === statusFilter);
        }

        setFilteredNotes(result);
    }, [searchQuery, statusFilter, deliveryNotes]);

    const handleDeleteNote = useCallback((note) => {
        setNoteToDelete(note);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!noteToDelete) return;
        
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('delivery_notes')
                .delete()
                .eq('id', noteToDelete.id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Delete error:', error);
                Alert.alert('Erreur', error.message);
            } else {
                setDeliveryNotes(prev => prev.filter(note => note.id !== noteToDelete.id));
                Alert.alert('✓ Succès', 'Bon de livraison supprimé avec succès');
            }
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Erreur', 'Impossible de supprimer le bon de livraison');
        }
        
        setNoteToDelete(null);
    }, [noteToDelete, user]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setNoteToDelete(null);
    }, []);

    const tableColumns = useMemo(() => {
        return [
            {
                key: 'note_number',
                label: 'N° Bon',
                flex: 1.2,
                render: (row) => (
                    <View>
                        <Text style={[localStyles.noteNumber, { color: tTheme.primary }]} numberOfLines={1}>
                            {row.note_number}
                        </Text>
                        <Text style={[localStyles.noteDate, { color: tTheme.textSecondary }]}>
                            {row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : 'N/A'}
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
                key: 'status',
                label: 'Statut',
                flex: 1,
                render: (row) => {
                    const statusConfig = {
                        'pending': { label: 'En attente', variant: 'warning' },
                        'delivered': { label: 'Livré', variant: 'success' },
                        'cancelled': { label: 'Annulé', variant: 'default' },
                    };
                    const config = statusConfig[row.status] || { label: 'En attente', variant: 'warning' };
                    return <ModernStatusBadge label={config.label} variant={config.variant} />;
                },
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
                                Alert.alert('Impression', `Impression du bon ${row.delivery_note_number}`);
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
                                handleDeleteNote(row);
                            }}
                        >
                            <Ionicons name="trash" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ),
            },
        ];
    }, [tTheme, handleDeleteNote]);

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'pending', label: 'En attente' },
        { value: 'delivered', label: 'Livré' },
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
                        placeholder="Rechercher un bon de livraison..."
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

                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={localStyles.tableWrapper}
                    contentContainerStyle={{ minWidth: '100%' }}
                >
                    <View style={{ flex: 1, minWidth: isMobile ? 800 : '100%' }}>
                        <ModernTable
                            data={filteredNotes}
                            columns={tableColumns}
                            onRowPress={(note) => navigation.navigate('DeliveryNoteDetails', { note_id: note.id })}
                            theme={theme}
                            loading={loading}
                            emptyMessage="Aucun bon de livraison trouvé. Créez votre premier bon de livraison."
                        />
                    </View>
                </ScrollView>
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelDelete}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>

                        <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                            Supprimer le bon de livraison
                        </Text>

                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Êtes-vous sûr de vouloir supprimer le bon {noteToDelete?.note_number} ? Cette action est irréversible.
                        </Text>

                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.cancelButton, { 
                                    backgroundColor: tTheme.background,
                                    borderColor: tTheme.border
                                }]}
                                onPress={cancelDelete}
                            >
                                <Text style={[localStyles.cancelButtonText, { color: tTheme.text }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.confirmButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={localStyles.confirmButtonText}>
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
    noteNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    noteDate: {
        fontSize: 12,
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
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#DC2626',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
