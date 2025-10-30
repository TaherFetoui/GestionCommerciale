import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import { themes } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function PaymentSlipsScreen() {
    const navigation = useNavigation();
    const [slips, setSlips] = useState([]);
    const [filteredSlips, setFilteredSlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState(null);

    const [formSlipNumber, setFormSlipNumber] = useState('');
    const [formSlipType, setFormSlipType] = useState('checks');
    const [formBankAccount, setFormBankAccount] = useState('');
    const [formTotalAmount, setFormTotalAmount] = useState('');
    const [formDepositDate, setFormDepositDate] = useState('');
    const [formStatus, setFormStatus] = useState('draft');
    const [formNote, setFormNote] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    const { theme, user } = useAuth();
    const tTheme = themes[theme];
    const styles = getGlobalStyles(theme);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
                    <ModernActionButton icon="add" label="Nouveau bordereau" onPress={handleCreateSlip} variant="primary" />
                </View>
            ),
        });
    }, [navigation]);

    const fetchSlips = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('payment_slips').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error:', error);
        else {
            setSlips(data || []);
            applyFilters(data || [], searchQuery, statusFilter);
        }
        setLoading(false);
    }, [searchQuery, statusFilter]);

    useFocusEffect(useCallback(() => { fetchSlips(); }, [fetchSlips]));
    const onRefresh = useCallback(async () => { setRefreshing(true); await fetchSlips(); setRefreshing(false); }, [fetchSlips]);

    const applyFilters = useCallback((data, search, status) => {
        let filtered = [...data];
        if (search) filtered = filtered.filter(item => item.slip_number?.toLowerCase().includes(search.toLowerCase()) || item.bank_account?.toLowerCase().includes(search.toLowerCase()));
        if (status !== 'all') filtered = filtered.filter(item => item.status === status);
        setFilteredSlips(filtered);
    }, []);

    const handleSearch = useCallback((text) => { setSearchQuery(text); applyFilters(slips, text, statusFilter); }, [slips, statusFilter, applyFilters]);
    const handleStatusFilter = useCallback((status) => { setStatusFilter(status); applyFilters(slips, searchQuery, status); }, [slips, searchQuery, applyFilters]);

    const handleCreateSlip = useCallback(() => {
        setFormSlipNumber(`BV-${Date.now()}`);
        setFormSlipType('checks');
        setFormBankAccount('');
        setFormTotalAmount('');
        setFormDepositDate('');
        setFormStatus('draft');
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditSlip = useCallback((item) => {
        setSelectedSlip(item);
        setFormSlipNumber(item.slip_number || '');
        setFormSlipType(item.slip_type || 'checks');
        setFormBankAccount(item.bank_account || '');
        setFormTotalAmount(item.total_amount?.toString() || '');
        setFormDepositDate(item.deposit_date || '');
        setFormStatus(item.status || 'draft');
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteSlip = useCallback((item) => { setSelectedSlip(item); setDeleteModalVisible(true); }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedSlip) return;
        setSaveLoading(true);
        const { error } = await supabase.from('payment_slips').delete().eq('id', selectedSlip.id);
        if (error) alert('Erreur');
        else { setDeleteModalVisible(false); setSelectedSlip(null); await fetchSlips(); }
        setSaveLoading(false);
    }, [selectedSlip, fetchSlips]);

    const handleSaveNewSlip = useCallback(async () => {
        if (!formBankAccount || !formTotalAmount) { alert('Champs obligatoires manquants'); return; }
        setSaveLoading(true);
        const { error } = await supabase.from('payment_slips').insert([{
            slip_number: formSlipNumber,
            slip_type: formSlipType,
            bank_account: formBankAccount,
            total_amount: parseFloat(formTotalAmount),
            deposit_date: formDepositDate || null,
            status: formStatus,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) alert('Erreur');
        else { setCreateModalVisible(false); await fetchSlips(); }
        setSaveLoading(false);
    }, [formSlipNumber, formSlipType, formBankAccount, formTotalAmount, formDepositDate, formStatus, formNote, user, fetchSlips]);

    const handleUpdateSlip = useCallback(async () => {
        if (!selectedSlip) return;
        setSaveLoading(true);
        const { error } = await supabase.from('payment_slips').update({
            slip_number: formSlipNumber,
            slip_type: formSlipType,
            bank_account: formBankAccount,
            total_amount: parseFloat(formTotalAmount),
            deposit_date: formDepositDate || null,
            status: formStatus,
            note: formNote,
        }).eq('id', selectedSlip.id);
        if (error) alert('Erreur');
        else { setEditModalVisible(false); setSelectedSlip(null); await fetchSlips(); }
        setSaveLoading(false);
    }, [selectedSlip, formSlipNumber, formSlipType, formBankAccount, formTotalAmount, formDepositDate, formStatus, formNote, fetchSlips]);

    const tableColumns = [
        { key: 'slip_number', label: 'N° Bordereau', width: 150 },
        { key: 'slip_type', label: 'Type', width: 120 },
        { key: 'bank_account', label: 'Compte bancaire', width: 180 },
        { key: 'total_amount', label: 'Montant total', width: 140, align: 'right' },
        { key: 'deposit_date', label: 'Date dépôt', width: 120 },
        { key: 'status', label: 'Statut', width: 120 },
        { key: 'actions', label: 'Actions', width: 150 },
    ];

    const getStatusVariant = (status) => ({ draft: 'default', submitted: 'warning', processed: 'success', rejected: 'error' }[status] || 'default');
    const getStatusLabel = (status) => ({ draft: 'Brouillon', submitted: 'Soumis', processed: 'Traité', rejected: 'Rejeté' }[status] || status);
    const getSlipTypeLabel = (type) => ({ checks: 'Chèques', cash: 'Espèces', mixed: 'Mixte' }[type] || type);

    const renderTableRow = (item) => ({
        slip_number: item.slip_number || '-',
        slip_type: getSlipTypeLabel(item.slip_type),
        bank_account: item.bank_account || '-',
        total_amount: `${parseFloat(item.total_amount || 0).toFixed(3)} TND`,
        deposit_date: item.deposit_date || '-',
        status: <ModernStatusBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />,
        actions: (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditSlip(item)} style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '20' }]}><Ionicons name="pencil" size={16} color={tTheme.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSlip(item)} style={[localStyles.actionButton, { backgroundColor: '#ff444420' }]}><Ionicons name="trash" size={16} color="#ff4444" /></TouchableOpacity>
            </View>
        ),
    });

    const renderForm = () => (
        <ScrollView style={{ maxHeight: 500 }}>
            <Text style={[styles.label, { color: tTheme.text }]}>N° Bordereau</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} value={formSlipNumber} editable={false} />
            <Text style={[styles.label, { color: tTheme.text }]}>Type de bordereau</Text>
            <View style={localStyles.typeButtons}>
                {['checks', 'cash', 'mixed'].map(type => (
                    <TouchableOpacity key={type} style={[localStyles.typeButton, formSlipType === type && { backgroundColor: tTheme.primary }]} onPress={() => setFormSlipType(type)}>
                        <Text style={[localStyles.typeButtonText, formSlipType === type && { color: '#FFF' }]}>{getSlipTypeLabel(type)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={[styles.label, { color: tTheme.text }]}>Compte bancaire *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Compte" placeholderTextColor={tTheme.textSecondary} value={formBankAccount} onChangeText={setFormBankAccount} />
            <Text style={[styles.label, { color: tTheme.text }]}>Montant total *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="0.000" placeholderTextColor={tTheme.textSecondary} value={formTotalAmount} onChangeText={setFormTotalAmount} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: tTheme.text }]}>Date de dépôt</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formDepositDate} onChangeText={setFormDepositDate} />
            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                {['draft', 'submitted', 'processed', 'rejected'].map(status => (
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
                <ModernSearchBar value={searchQuery} onChangeText={handleSearch} placeholder="Rechercher..." />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChips}>
                    <ModernFilterChip label="Tous" active={statusFilter === 'all'} onPress={() => handleStatusFilter('all')} />
                    <ModernFilterChip label="Brouillon" active={statusFilter === 'draft'} onPress={() => handleStatusFilter('draft')} />
                    <ModernFilterChip label="Soumis" active={statusFilter === 'submitted'} onPress={() => handleStatusFilter('submitted')} />
                    <ModernFilterChip label="Traité" active={statusFilter === 'processed'} onPress={() => handleStatusFilter('processed')} />
                </ScrollView>
            </View>
            <ModernTable columns={tableColumns} data={filteredSlips} renderRow={renderTableRow} loading={loading} emptyMessage="Aucun bordereau trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouveau bordereau</Text><TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setCreateModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleSaveNewSlip} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier le bordereau</Text><TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setEditModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleUpdateSlip} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.deleteModal, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <Ionicons name="warning" size={48} color="#ff4444" />
                        <Text style={[localStyles.deleteTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.deleteMessage, { color: tTheme.textSecondary }]}>Supprimer ce bordereau ?</Text>
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
