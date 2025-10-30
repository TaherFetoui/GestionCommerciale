import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    ModernActionButton,
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SupplierReturnsScreen() {
    const navigation = useNavigation();
    const [returns, setReturns] = useState([]);
    const [filteredReturns, setFilteredReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);

    // Form states
    const [formSupplier, setFormSupplier] = useState('');
    const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
    const [formRetentionRate, setFormRetentionRate] = useState('1.5');
    const [formRetentionAmount, setFormRetentionAmount] = useState('');
    const [formInvoiceAmount, setFormInvoiceAmount] = useState('');
    const [formRetentionDate, setFormRetentionDate] = useState(new Date().toISOString().split('T')[0]);
    const [formNote, setFormNote] = useState('');
    const [formStatus, setFormStatus] = useState('pending');
    const [saveLoading, setSaveLoading] = useState(false);

    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    // Header buttons setup
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
                    <ModernActionButton
                        icon="add"
                        label="Nouvelle retenue"
                        onPress={handleCreateReturn}
                        variant="primary"
                    />
                </View>
            ),
        });
    }, [navigation]);

    const fetchReturns = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('supplier_returns')
            .select('*')
            .order('retention_date', { ascending: false });
        
        if (error) {
            console.error('Error fetching supplier returns:', error);
        } else {
            setReturns(data || []);
            setFilteredReturns(data || []);
        }
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchReturns();
        }, [fetchReturns])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchReturns();
        setRefreshing(false);
    }, [fetchReturns]);

    // Filter and search logic
    useCallback(() => {
        let filtered = [...returns];

        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        setFilteredReturns(filtered);
    }, [returns, searchQuery, statusFilter]);

    // CRUD Handlers
    const handleCreateReturn = useCallback(() => {
        setFormSupplier('');
        setFormInvoiceNumber('');
        setFormRetentionRate('1.5');
        setFormRetentionAmount('');
        setFormInvoiceAmount('');
        setFormRetentionDate(new Date().toISOString().split('T')[0]);
        setFormNote('');
        setFormStatus('pending');
        setCreateModalVisible(true);
    }, []);

    const handleEditReturn = useCallback((item) => {
        setSelectedReturn(item);
        setFormSupplier(item.supplier || '');
        setFormInvoiceNumber(item.invoice_number || '');
        setFormRetentionRate(item.retention_rate?.toString() || '1.5');
        setFormRetentionAmount(item.retention_amount?.toString() || '');
        setFormInvoiceAmount(item.invoice_amount?.toString() || '');
        setFormRetentionDate(item.retention_date || new Date().toISOString().split('T')[0]);
        setFormNote(item.note || '');
        setFormStatus(item.status || 'pending');
        setEditModalVisible(true);
    }, []);

    const handleDeleteReturn = useCallback((item) => {
        setSelectedReturn(item);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedReturn) return;
        
        setSaveLoading(true);
        const { error } = await supabase
            .from('supplier_returns')
            .delete()
            .eq('id', selectedReturn.id);

        if (error) {
            console.error('Error deleting return:', error);
            alert('Erreur lors de la suppression');
        } else {
            setDeleteModalVisible(false);
            setSelectedReturn(null);
            await fetchReturns();
        }
        setSaveLoading(false);
    }, [selectedReturn, fetchReturns]);

    const handleSaveNewReturn = useCallback(async () => {
        if (!formSupplier || !formInvoiceNumber || !formRetentionAmount) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setSaveLoading(true);
        const { error } = await supabase.from('supplier_returns').insert([{
            supplier: formSupplier,
            invoice_number: formInvoiceNumber,
            retention_rate: parseFloat(formRetentionRate),
            retention_amount: parseFloat(formRetentionAmount),
            invoice_amount: parseFloat(formInvoiceAmount),
            retention_date: formRetentionDate,
            note: formNote,
            status: formStatus,
            created_by: user?.id,
        }]);

        if (error) {
            console.error('Error creating return:', error);
            alert('Erreur lors de la création');
        } else {
            setCreateModalVisible(false);
            await fetchReturns();
        }
        setSaveLoading(false);
    }, [formSupplier, formInvoiceNumber, formRetentionRate, formRetentionAmount, formInvoiceAmount, formRetentionDate, formNote, formStatus, user, fetchReturns]);

    const handleUpdateReturn = useCallback(async () => {
        if (!selectedReturn) return;

        setSaveLoading(true);
        const { error } = await supabase
            .from('supplier_returns')
            .update({
                supplier: formSupplier,
                invoice_number: formInvoiceNumber,
                retention_rate: parseFloat(formRetentionRate),
                retention_amount: parseFloat(formRetentionAmount),
                invoice_amount: parseFloat(formInvoiceAmount),
                retention_date: formRetentionDate,
                note: formNote,
                status: formStatus,
            })
            .eq('id', selectedReturn.id);

        if (error) {
            console.error('Error updating return:', error);
            alert('Erreur lors de la modification');
        } else {
            setEditModalVisible(false);
            setSelectedReturn(null);
            await fetchReturns();
        }
        setSaveLoading(false);
    }, [selectedReturn, formSupplier, formInvoiceNumber, formRetentionRate, formRetentionAmount, formInvoiceAmount, formRetentionDate, formNote, formStatus, fetchReturns]);

    // Table configuration
    const tableColumns = [
        { key: 'supplier', label: 'Fournisseur', width: 200 },
        { key: 'invoice_number', label: 'N° Facture', width: 150 },
        { key: 'invoice_amount', label: 'Montant Facture', width: 150, align: 'right' },
        { key: 'retention_rate', label: 'Taux (%)', width: 100, align: 'center' },
        { key: 'retention_amount', label: 'Montant Retenue', width: 150, align: 'right' },
        { key: 'retention_date', label: 'Date', width: 120 },
        { key: 'status', label: 'Statut', width: 120 },
        { key: 'actions', label: 'Actions', width: 150 },
    ];

    const getStatusInfo = (status) => {
        const statuses = {
            pending: { label: 'En attente', variant: 'warning' },
            paid: { label: 'Payée', variant: 'success' },
            cancelled: { label: 'Annulée', variant: 'error' },
        };
        return statuses[status] || { label: status, variant: 'neutral' };
    };

    const renderTableRow = (item) => {
        const statusInfo = getStatusInfo(item.status);
        
        return {
            supplier: item.supplier || '-',
            invoice_number: item.invoice_number || '-',
            invoice_amount: `${parseFloat(item.invoice_amount || 0).toFixed(3)} DT`,
            retention_rate: `${parseFloat(item.retention_rate || 0).toFixed(2)}%`,
            retention_amount: `${parseFloat(item.retention_amount || 0).toFixed(3)} DT`,
            retention_date: item.retention_date || '-',
            status: <ModernStatusBadge label={statusInfo.label} variant={statusInfo.variant} />,
            actions: (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => handleEditReturn(item)}
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '20' }]}
                    >
                        <Ionicons name="pencil" size={16} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteReturn(item)}
                        style={[localStyles.actionButton, { backgroundColor: '#ff444420' }]}
                    >
                        <Ionicons name="trash" size={16} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            ),
        };
    };

    const renderForm = (isEdit = false) => (
        <View>
            <Text style={[styles.label, { color: tTheme.text }]}>Fournisseur *</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="Nom du fournisseur"
                placeholderTextColor={tTheme.textSecondary}
                value={formSupplier}
                onChangeText={setFormSupplier}
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Numéro de facture *</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="Ex: FAC-2025-001"
                placeholderTextColor={tTheme.textSecondary}
                value={formInvoiceNumber}
                onChangeText={setFormInvoiceNumber}
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Montant de la facture</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="0.000"
                placeholderTextColor={tTheme.textSecondary}
                value={formInvoiceAmount}
                onChangeText={setFormInvoiceAmount}
                keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Taux de retenue (%)</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="1.5"
                placeholderTextColor={tTheme.textSecondary}
                value={formRetentionRate}
                onChangeText={setFormRetentionRate}
                keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Montant de la retenue *</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="0.000"
                placeholderTextColor={tTheme.textSecondary}
                value={formRetentionAmount}
                onChangeText={setFormRetentionAmount}
                keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Date de retenue</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={tTheme.textSecondary}
                value={formRetentionDate}
                onChangeText={setFormRetentionDate}
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                <TouchableOpacity
                    style={[localStyles.statusButton, formStatus === 'pending' && { backgroundColor: tTheme.warning }]}
                    onPress={() => setFormStatus('pending')}
                >
                    <Text style={[localStyles.statusButtonText, formStatus === 'pending' && { color: '#FFF' }]}>En attente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[localStyles.statusButton, formStatus === 'paid' && { backgroundColor: tTheme.success }]}
                    onPress={() => setFormStatus('paid')}
                >
                    <Text style={[localStyles.statusButtonText, formStatus === 'paid' && { color: '#FFF' }]}>Payée</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[localStyles.statusButton, formStatus === 'cancelled' && { backgroundColor: tTheme.error }]}
                    onPress={() => setFormStatus('cancelled')}
                >
                    <Text style={[localStyles.statusButtonText, formStatus === 'cancelled' && { color: '#FFF' }]}>Annulée</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: tTheme.text }]}>Note</Text>
            <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="Note optionnelle..."
                placeholderTextColor={tTheme.textSecondary}
                value={formNote}
                onChangeText={setFormNote}
                multiline
                numberOfLines={4}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            {/* Search and Filters */}
            <View style={[localStyles.filtersContainer, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                <ModernSearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Rechercher par fournisseur ou N° facture..."
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChips}>
                    <ModernFilterChip
                        label="Tous"
                        active={statusFilter === 'all'}
                        onPress={() => setStatusFilter('all')}
                    />
                    <ModernFilterChip
                        label="En attente"
                        active={statusFilter === 'pending'}
                        onPress={() => setStatusFilter('pending')}
                    />
                    <ModernFilterChip
                        label="Payée"
                        active={statusFilter === 'paid'}
                        onPress={() => setStatusFilter('paid')}
                    />
                    <ModernFilterChip
                        label="Annulée"
                        active={statusFilter === 'cancelled'}
                        onPress={() => setStatusFilter('cancelled')}
                    />
                </ScrollView>
            </View>

            {/* Table */}
            <ModernTable
                columns={tableColumns}
                data={filteredReturns}
                renderRow={renderTableRow}
                loading={loading}
                emptyMessage="Aucune retenue fournisseur trouvée"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />

            {/* Create Modal */}
            <Modal
                visible={createModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouvelle retenue fournisseur</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={localStyles.modalBody}>
                            {renderForm(false)}
                        </ScrollView>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { borderColor: tTheme.border }]}
                                onPress={() => setCreateModalVisible(false)}
                            >
                                <Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: tTheme.primary }]}
                                onPress={handleSaveNewReturn}
                                disabled={saveLoading}
                            >
                                <Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier la retenue</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={localStyles.modalBody}>
                            {renderForm(true)}
                        </ScrollView>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { borderColor: tTheme.border }]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: tTheme.primary }]}
                                onPress={handleUpdateReturn}
                                disabled={saveLoading}
                            >
                                <Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Modal */}
            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.deleteModal, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <Ionicons name="warning" size={48} color="#ff4444" />
                        <Text style={[localStyles.deleteTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.deleteMessage, { color: tTheme.textSecondary }]}>
                            Êtes-vous sûr de vouloir supprimer cette retenue ? Cette action est irréversible.
                        </Text>
                        <View style={localStyles.deleteActions}>
                            <TouchableOpacity
                                style={[styles.secondaryButton, { flex: 1, borderColor: tTheme.border }]}
                                onPress={() => setDeleteModalVisible(false)}
                            >
                                <Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 1, backgroundColor: '#ff4444' }]}
                                onPress={confirmDelete}
                                disabled={saveLoading}
                            >
                                <Text style={styles.primaryButtonText}>{saveLoading ? 'Suppression...' : 'Supprimer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const localStyles = StyleSheet.create({
    filtersContainer: {
        padding: 16,
        marginBottom: 16,
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 16,
    },
    filterChips: {
        marginTop: 12,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 600,
        maxHeight: '90%',
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalBody: {
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    statusButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    deleteModal: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    deleteTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    deleteMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    deleteActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
});
