import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import { themes } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ChecksScreen() {
    const navigation = useNavigation();
    const [checks, setChecks] = useState([]);
    const [filteredChecks, setFilteredChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedCheck, setSelectedCheck] = useState(null);

    const [formCheckType, setFormCheckType] = useState('received');
    const [formCheckNumber, setFormCheckNumber] = useState('');
    const [formDrawerName, setFormDrawerName] = useState('');
    const [formBankName, setFormBankName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formIssueDate, setFormIssueDate] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
    const [formDepositDate, setFormDepositDate] = useState('');
    const [formStatus, setFormStatus] = useState('pending');
    const [formNote, setFormNote] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    const { theme, user } = useAuth();
    const tTheme = themes[theme];
    const styles = getGlobalStyles(theme);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
                    <ModernActionButton icon="add" label="Nouveau chèque" onPress={handleCreateCheck} variant="primary" />
                </View>
            ),
        });
    }, [navigation]);

    const fetchChecks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('checks').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching checks:', error);
        else {
            setChecks(data || []);
            applyFilters(data || [], searchQuery, statusFilter);
        }
        setLoading(false);
    }, [searchQuery, statusFilter]);

    useFocusEffect(useCallback(() => { fetchChecks(); }, [fetchChecks]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchChecks();
        setRefreshing(false);
    }, [fetchChecks]);

    const applyFilters = useCallback((data, search, status) => {
        let filtered = [...data];
        if (search) {
            filtered = filtered.filter(item =>
                item.check_number?.toLowerCase().includes(search.toLowerCase()) ||
                item.drawer_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.bank_name?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (status !== 'all') filtered = filtered.filter(item => item.status === status);
        setFilteredChecks(filtered);
    }, []);

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        applyFilters(checks, text, statusFilter);
    }, [checks, statusFilter, applyFilters]);

    const handleStatusFilter = useCallback((status) => {
        setStatusFilter(status);
        applyFilters(checks, searchQuery, status);
    }, [checks, searchQuery, applyFilters]);

    const handleCreateCheck = useCallback(() => {
        setFormCheckType('received');
        setFormCheckNumber('');
        setFormDrawerName('');
        setFormBankName('');
        setFormAmount('');
        setFormIssueDate('');
        setFormDueDate('');
        setFormDepositDate('');
        setFormStatus('pending');
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditCheck = useCallback((item) => {
        setSelectedCheck(item);
        setFormCheckType(item.check_type || 'received');
        setFormCheckNumber(item.check_number || '');
        setFormDrawerName(item.drawer_name || '');
        setFormBankName(item.bank_name || '');
        setFormAmount(item.amount?.toString() || '');
        setFormIssueDate(item.issue_date || '');
        setFormDueDate(item.due_date || '');
        setFormDepositDate(item.deposit_date || '');
        setFormStatus(item.status || 'pending');
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteCheck = useCallback((item) => {
        setSelectedCheck(item);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedCheck) return;
        setSaveLoading(true);
        const { error } = await supabase.from('checks').delete().eq('id', selectedCheck.id);
        if (error) alert('Erreur lors de la suppression');
        else {
            setDeleteModalVisible(false);
            setSelectedCheck(null);
            await fetchChecks();
        }
        setSaveLoading(false);
    }, [selectedCheck, fetchChecks]);

    const handleSaveNewCheck = useCallback(async () => {
        if (!formCheckNumber || !formAmount) {
            alert('Veuillez remplir les champs obligatoires');
            return;
        }
        setSaveLoading(true);
        const { error } = await supabase.from('checks').insert([{
            check_type: formCheckType,
            check_number: formCheckNumber,
            drawer_name: formDrawerName,
            bank_name: formBankName,
            amount: parseFloat(formAmount),
            issue_date: formIssueDate || null,
            due_date: formDueDate || null,
            deposit_date: formDepositDate || null,
            status: formStatus,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) alert('Erreur lors de la création');
        else {
            setCreateModalVisible(false);
            await fetchChecks();
        }
        setSaveLoading(false);
    }, [formCheckType, formCheckNumber, formDrawerName, formBankName, formAmount, formIssueDate, formDueDate, formDepositDate, formStatus, formNote, user, fetchChecks]);

    const handleUpdateCheck = useCallback(async () => {
        if (!selectedCheck) return;
        setSaveLoading(true);
        const { error } = await supabase.from('checks').update({
            check_type: formCheckType,
            check_number: formCheckNumber,
            drawer_name: formDrawerName,
            bank_name: formBankName,
            amount: parseFloat(formAmount),
            issue_date: formIssueDate || null,
            due_date: formDueDate || null,
            deposit_date: formDepositDate || null,
            status: formStatus,
            note: formNote,
        }).eq('id', selectedCheck.id);
        if (error) alert('Erreur lors de la modification');
        else {
            setEditModalVisible(false);
            setSelectedCheck(null);
            await fetchChecks();
        }
        setSaveLoading(false);
    }, [selectedCheck, formCheckType, formCheckNumber, formDrawerName, formBankName, formAmount, formIssueDate, formDueDate, formDepositDate, formStatus, formNote, fetchChecks]);

    const tableColumns = [
        { key: 'check_number', label: 'N° Chèque', width: 120 },
        { key: 'check_type', label: 'Type', width: 100 },
        { key: 'drawer_name', label: 'Tireur', width: 180 },
        { key: 'bank_name', label: 'Banque', width: 150 },
        { key: 'amount', label: 'Montant', width: 120, align: 'right' },
        { key: 'due_date', label: 'Échéance', width: 120 },
        { key: 'status', label: 'Statut', width: 120 },
        { key: 'actions', label: 'Actions', width: 150 },
    ];

    const getStatusVariant = (status) => {
        const variants = { pending: 'warning', deposited: 'info', encashed: 'success', bounced: 'error', cancelled: 'error' };
        return variants[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const labels = { pending: 'En attente', deposited: 'Déposé', encashed: 'Encaissé', bounced: 'Rejeté', cancelled: 'Annulé' };
        return labels[status] || status;
    };

    const renderTableRow = (item) => ({
        check_number: item.check_number || '-',
        check_type: item.check_type === 'received' ? 'Reçu' : 'Émis',
        drawer_name: item.drawer_name || '-',
        bank_name: item.bank_name || '-',
        amount: `${parseFloat(item.amount || 0).toFixed(3)} TND`,
        due_date: item.due_date || '-',
        status: <ModernStatusBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />,
        actions: (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditCheck(item)} style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '20' }]}>
                    <Ionicons name="pencil" size={16} color={tTheme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCheck(item)} style={[localStyles.actionButton, { backgroundColor: '#ff444420' }]}>
                    <Ionicons name="trash" size={16} color="#ff4444" />
                </TouchableOpacity>
            </View>
        ),
    });

    const renderForm = () => (
        <ScrollView style={{ maxHeight: 500 }}>
            <Text style={[styles.label, { color: tTheme.text }]}>Type de chèque *</Text>
            <View style={localStyles.typeButtons}>
                <TouchableOpacity style={[localStyles.typeButton, formCheckType === 'received' && { backgroundColor: tTheme.primary }]} onPress={() => setFormCheckType('received')}>
                    <Text style={[localStyles.typeButtonText, formCheckType === 'received' && { color: '#FFF' }]}>Reçu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[localStyles.typeButton, formCheckType === 'issued' && { backgroundColor: tTheme.primary }]} onPress={() => setFormCheckType('issued')}>
                    <Text style={[localStyles.typeButtonText, formCheckType === 'issued' && { color: '#FFF' }]}>Émis</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: tTheme.text }]}>Numéro de chèque *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Ex: 1234567" placeholderTextColor={tTheme.textSecondary} value={formCheckNumber} onChangeText={setFormCheckNumber} keyboardType="numeric" />

            <Text style={[styles.label, { color: tTheme.text }]}>Tireur (Nom)</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Nom du tireur" placeholderTextColor={tTheme.textSecondary} value={formDrawerName} onChangeText={setFormDrawerName} />

            <Text style={[styles.label, { color: tTheme.text }]}>Banque</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Nom de la banque" placeholderTextColor={tTheme.textSecondary} value={formBankName} onChangeText={setFormBankName} />

            <Text style={[styles.label, { color: tTheme.text }]}>Montant *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="0.000" placeholderTextColor={tTheme.textSecondary} value={formAmount} onChangeText={setFormAmount} keyboardType="decimal-pad" />

            <Text style={[styles.label, { color: tTheme.text }]}>Date d'émission</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formIssueDate} onChangeText={setFormIssueDate} />

            <Text style={[styles.label, { color: tTheme.text }]}>Date d'échéance</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formDueDate} onChangeText={setFormDueDate} />

            <Text style={[styles.label, { color: tTheme.text }]}>Date de dépôt</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formDepositDate} onChangeText={setFormDepositDate} />

            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                {['pending', 'deposited', 'encashed', 'bounced', 'cancelled'].map(status => (
                    <TouchableOpacity key={status} style={[localStyles.statusButton, formStatus === status && { backgroundColor: tTheme.primary }]} onPress={() => setFormStatus(status)}>
                        <Text style={[localStyles.statusButtonText, formStatus === status && { color: '#FFF' }]}>{getStatusLabel(status)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.label, { color: tTheme.text }]}>Note</Text>
            <TextInput style={[styles.input, styles.textArea, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Notes..." placeholderTextColor={tTheme.textSecondary} value={formNote} onChangeText={setFormNote} multiline numberOfLines={3} />
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <View style={[localStyles.filtersContainer, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                <ModernSearchBar value={searchQuery} onChangeText={handleSearch} placeholder="Rechercher un chèque..." />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChips}>
                    <ModernFilterChip label="Tous" active={statusFilter === 'all'} onPress={() => handleStatusFilter('all')} />
                    <ModernFilterChip label="En attente" active={statusFilter === 'pending'} onPress={() => handleStatusFilter('pending')} />
                    <ModernFilterChip label="Déposé" active={statusFilter === 'deposited'} onPress={() => handleStatusFilter('deposited')} />
                    <ModernFilterChip label="Encaissé" active={statusFilter === 'encashed'} onPress={() => handleStatusFilter('encashed')} />
                    <ModernFilterChip label="Rejeté" active={statusFilter === 'bounced'} onPress={() => handleStatusFilter('bounced')} />
                </ScrollView>
            </View>

            <ModernTable columns={tableColumns} data={filteredChecks} renderRow={renderTableRow} loading={loading} emptyMessage="Aucun chèque trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />

            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouveau chèque</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity>
                        </View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setCreateModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleSaveNewCheck} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier le chèque</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity>
                        </View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setEditModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleUpdateCheck} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.deleteModal, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <Ionicons name="warning" size={48} color="#ff4444" />
                        <Text style={[localStyles.deleteTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.deleteMessage, { color: tTheme.textSecondary }]}>Êtes-vous sûr de vouloir supprimer ce chèque ?</Text>
                        <View style={localStyles.deleteActions}>
                            <TouchableOpacity style={[styles.secondaryButton, { flex: 1, borderColor: tTheme.border }]} onPress={() => setDeleteModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: '#ff4444' }]} onPress={confirmDelete} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Suppression...' : 'Supprimer'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const localStyles = StyleSheet.create({
    filtersContainer: { padding: 16, marginBottom: 16, borderRadius: 16, marginHorizontal: 16, marginTop: 16 },
    filterChips: { marginTop: 12 },
    actionButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    modalContent: { width: '90%', maxWidth: 700, maxHeight: '90%', borderRadius: 24, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalBody: { padding: 20 },
    modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    typeButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    typeButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    typeButtonText: { fontSize: 14, fontWeight: '600' },
    statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    statusButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    statusButtonText: { fontSize: 13, fontWeight: '600' },
    deleteModal: { width: '90%', maxWidth: 400, borderRadius: 24, padding: 24, alignItems: 'center' },
    deleteTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    deleteMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    deleteActions: { flexDirection: 'row', gap: 12, width: '100%' },
});
