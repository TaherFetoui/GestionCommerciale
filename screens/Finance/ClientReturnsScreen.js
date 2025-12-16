import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
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
import Toast from '../../components/Toast';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { printFinanceDocument } from '../../services/pdfGenerator';
import { getGlobalStyles, themes } from '../../styles/GlobalStyles';

export default function ClientReturnsScreen() {
    const navigation = useNavigation();
    const [returns, setReturns] = useState([]);
    const [filteredReturns, setFilteredReturns] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [returnToDelete, setReturnToDelete] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Form states
    const [formClient, setFormClient] = useState('');
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
        const fetchCompanyInfo = async () => {
            if (!user?.id) return;
            const { data } = await supabase.from('company_info').select('*').eq('user_id', user.id).single();
            if (data) setCompanyInfo(data);
        };
        fetchCompanyInfo();

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
        
        // Récupérer les clients
        const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true });
        
        if (clientsError) {
            console.error('Error fetching clients:', clientsError);
        } else {
            setClients(clientsData || []);
        }
        
        // Récupérer les retenues
        const { data, error } = await supabase
            .from('client_returns')
            .select('*')
            .order('retention_date', { ascending: false });
        
        if (error) {
            console.error('Error fetching client returns:', error);
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
                item.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        setFormClient('');
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
        setFormClient(item.client || '');
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
        if (!returnToDelete) return;
        
        setDeleteModalVisible(false);
        const { error } = await supabase
            .from('client_returns')
            .delete()
            .eq('id', returnToDelete.id);

        if (error) {
            console.error('Error deleting return:', error);
            setToast({ visible: true, message: 'Erreur lors de la suppression', type: 'error' });
        } else {
            setReturns(prevReturns => prevReturns.filter(r => r.id !== returnToDelete.id));
            setToast({ visible: true, message: 'Retenue client supprimée avec succès', type: 'success' });
        }
        setReturnToDelete(null);
    }, [returnToDelete]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setReturnToDelete(null);
    }, []);

    const handleSaveNewReturn = useCallback(async () => {
        if (!formClient || !formInvoiceNumber || !formRetentionAmount) {
            setToast({ visible: true, message: 'Veuillez remplir tous les champs obligatoires', type: 'warning' });
            return;
        }

        setSaveLoading(true);
        const { error } = await supabase.from('client_returns').insert([{
            client: formClient,
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
            setToast({ visible: true, message: 'Erreur lors de la création', type: 'error' });
        } else {
            setCreateModalVisible(false);
            await fetchReturns();
            setToast({ visible: true, message: 'Retenue client créée avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [formClient, formInvoiceNumber, formRetentionRate, formRetentionAmount, formInvoiceAmount, formRetentionDate, formNote, formStatus, user, fetchReturns]);

    const handleUpdateReturn = useCallback(async () => {
        if (!selectedReturn) return;

        setSaveLoading(true);
        const { error } = await supabase
            .from('client_returns')
            .update({
                client: formClient,
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
            setToast({ visible: true, message: 'Erreur lors de la modification', type: 'error' });
        } else {
            setEditModalVisible(false);
            setSelectedReturn(null);
            await fetchReturns();
            setToast({ visible: true, message: 'Retenue client modifiée avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [selectedReturn, formClient, formInvoiceNumber, formRetentionRate, formRetentionAmount, formInvoiceAmount, formRetentionDate, formNote, formStatus, fetchReturns]);

    // Table configuration
    const getStatusInfo = (status) => {
        const statuses = {
            pending: { label: 'En attente', variant: 'warning' },
            received: { label: 'Reçue', variant: 'success' },
            cancelled: { label: 'Annulée', variant: 'error' },
        };
        return statuses[status] || { label: status, variant: 'neutral' };
    };

    const tableColumns = [
        { 
            key: 'client', 
            label: 'Client', 
            flex: 1.5,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.client || '-'}</Text>
        },
        { 
            key: 'invoice_number', 
            label: 'N° Facture', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.invoice_number || '-'}</Text>
        },
        { 
            key: 'invoice_amount', 
            label: 'Montant Facture', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text, textAlign: 'right' }}>{parseFloat(item.invoice_amount || 0).toFixed(3)} DT</Text>
        },
        { 
            key: 'retention_rate', 
            label: 'Taux Retenue (%)', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text, textAlign: 'center' }}>{parseFloat(item.retention_rate || 0).toFixed(2)}%</Text>
        },
        { 
            key: 'retention_amount', 
            label: 'Montant Retenue', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text, textAlign: 'right' }}>{parseFloat(item.retention_amount || 0).toFixed(3)} DT</Text>
        },
        { 
            key: 'retention_date', 
            label: 'Date Retenue', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.retention_date || '-'}</Text>
        },
        { 
            key: 'status', 
            label: 'Statut', 
            flex: 1,
            render: (item) => {
                const statusInfo = getStatusInfo(item.status);
                return <ModernStatusBadge label={statusInfo.label} variant={statusInfo.variant} />;
            }
        },
        { 
            key: 'actions', 
            label: 'Actions', 
            flex: 1,
            render: (item) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                        onPress={(e) => { e.stopPropagation(); printFinanceDocument(item, 'client_return', companyInfo); }}
                    >
                        <Ionicons name="print-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                        onPress={(e) => { e.stopPropagation(); setReturnToDelete(item); setDeleteModalVisible(true); }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            )
        },
    ];

    const renderForm = (isEdit = false) => (
        <View>
            <Text style={[styles.label, { color: tTheme.text }]}>Client *</Text>
            <View style={[styles.input, { backgroundColor: tTheme.card, borderColor: tTheme.border, padding: 0 }]}>
                <Picker
                    selectedValue={formClient}
                    onValueChange={(itemValue) => setFormClient(itemValue)}
                    style={{ color: tTheme.text }}
                    dropdownIconColor={tTheme.text}
                >
                    <Picker.Item label="-- Sélectionner un client --" value="" />
                    {clients.map(client => (
                        <Picker.Item key={client.id} label={client.name} value={client.name} />
                    ))}
                </Picker>
            </View>

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
                    style={[localStyles.statusButton, formStatus === 'received' && { backgroundColor: tTheme.success }]}
                    onPress={() => setFormStatus('received')}
                >
                    <Text style={[localStyles.statusButtonText, formStatus === 'received' && { color: '#FFF' }]}>Reçue</Text>
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
                    placeholder="Rechercher par client ou N° facture..."
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
                        label="Reçue"
                        active={statusFilter === 'received'}
                        onPress={() => setStatusFilter('received')}
                    />
                    <ModernFilterChip
                        label="Annulée"
                        active={statusFilter === 'cancelled'}
                        onPress={() => setStatusFilter('cancelled')}
                    />
                </ScrollView>
            </View>

            {/* Table avec scroll horizontal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
                <View style={{ minWidth: 1350 }}>
                    <ModernTable
                        columns={tableColumns}
                        data={filteredReturns}
                        loading={loading}
                        emptyMessage="Aucune retenue client trouvée"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                </View>
            </ScrollView>

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
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouvelle retenue client</Text>
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

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={cancelDelete}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalIconContainer}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>
                        <Text style={[localStyles.deleteModalTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Êtes-vous sûr de vouloir supprimer la retenue de{' '}
                            <Text style={{ fontWeight: '700', color: tTheme.text }}>{returnToDelete?.client_name}</Text> ?{' '}
                            Cette action est irréversible.
                        </Text>
                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.cancelButton, { borderColor: tTheme.border }]}
                                onPress={cancelDelete}
                            >
                                <Text style={[localStyles.modalButtonText, { color: tTheme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[localStyles.modalButton, { backgroundColor: '#DC2626' }]}
                                onPress={confirmDelete}
                            >
                                <Ionicons name="trash" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={[localStyles.modalButtonText, { color: '#FFF' }]}>Supprimer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                theme={theme}
                onHide={() => setToast({ ...toast, visible: false })}
            />
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
    actionsContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    actionButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    deleteButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    deleteModalContainer: { width: '90%', maxWidth: 400, borderRadius: 24, padding: 32, alignItems: 'center' },
    modalIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    deleteModalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    modalMessage: { fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
    modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    modalButton: { flex: 1, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cancelButton: { backgroundColor: 'transparent', borderWidth: 1.5 },
    modalButtonText: { fontSize: 16, fontWeight: '600' },
});
