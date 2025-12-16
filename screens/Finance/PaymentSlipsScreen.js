import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { printFinanceDocument } from '../../services/pdfGenerator';
import { getGlobalStyles, themes } from '../../styles/GlobalStyles';

export default function PaymentSlipsScreen() {
    const navigation = useNavigation();
    const [slips, setSlips] = useState([]);
    const [filteredSlips, setFilteredSlips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState(null);
    const [slipToDelete, setSlipToDelete] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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
        const fetchCompanyInfo = async () => {
            if (!user?.id) return;
            const { data } = await supabase.from('company_info').select('*').eq('user_id', user.id).single();
            if (data) setCompanyInfo(data);
        };
        fetchCompanyInfo();

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
        if (!slipToDelete) return;
        setDeleteModalVisible(false);
        const { error } = await supabase.from('payment_slips').delete().eq('id', slipToDelete.id);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la suppression', type: 'error' });
        } else {
            setSlips(prevSlips => prevSlips.filter(s => s.id !== slipToDelete.id));
            setToast({ visible: true, message: 'Bordereau supprimé avec succès', type: 'success' });
        }
        setSlipToDelete(null);
    }, [slipToDelete]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setSlipToDelete(null);
    }, []);

    const handleSaveNewSlip = useCallback(async () => {
        if (!formBankAccount || !formTotalAmount) { setToast({ visible: true, message: 'Champs obligatoires manquants', type: 'warning' }); return; }
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
        if (error) setToast({ visible: true, message: 'Erreur lors de la création', type: 'error' });
        else { setCreateModalVisible(false); setToast({ visible: true, message: 'Bordereau créé avec succès', type: 'success' }); await fetchSlips(); }
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
        if (error) setToast({ visible: true, message: 'Erreur lors de la modification', type: 'error' });
        else { setEditModalVisible(false); setSelectedSlip(null); setToast({ visible: true, message: 'Bordereau modifié avec succès', type: 'success' }); await fetchSlips(); }
        setSaveLoading(false);
    }, [selectedSlip, formSlipNumber, formSlipType, formBankAccount, formTotalAmount, formDepositDate, formStatus, formNote, fetchSlips]);

    const getStatusVariant = (status) => ({ draft: 'default', submitted: 'warning', processed: 'success', rejected: 'error' }[status] || 'default');
    const getStatusLabel = (status) => ({ draft: 'Brouillon', submitted: 'Soumis', processed: 'Traité', rejected: 'Rejeté' }[status] || status);
    const getSlipTypeLabel = (type) => ({ checks: 'Chèques', cash: 'Espèces', mixed: 'Mixte' }[type] || type);

    const tableColumns = [
        { 
            key: 'slip_number', 
            label: 'N° Bordereau', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.slip_number || '-'}</Text>
        },
        { 
            key: 'slip_type', 
            label: 'Type', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text }}>{getSlipTypeLabel(item.slip_type)}</Text>
        },
        { 
            key: 'bank_account', 
            label: 'Compte bancaire', 
            flex: 1.5,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.bank_account || '-'}</Text>
        },
        { 
            key: 'total_amount', 
            label: 'Montant total', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text, textAlign: 'right' }}>{parseFloat(item.total_amount || 0).toFixed(3)} TND</Text>
        },
        { 
            key: 'deposit_date', 
            label: 'Date dépôt', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.deposit_date || '-'}</Text>
        },
        { 
            key: 'status', 
            label: 'Statut', 
            flex: 1,
            render: (item) => <ModernStatusBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />
        },
        { 
            key: 'actions', 
            label: 'Actions', 
            flex: 1,
            render: (item) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                        onPress={(e) => { e.stopPropagation(); printFinanceDocument(item, 'payment_slip', companyInfo); }}
                    >
                        <Ionicons name="print-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                        onPress={(e) => { e.stopPropagation(); setSlipToDelete(item); setDeleteModalVisible(true); }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            )
        },
    ];

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
            <ModernTable columns={tableColumns} data={filteredSlips} loading={loading} emptyMessage="Aucun bordereau trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
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
            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={cancelDelete}>
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalIconContainer}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>
                        <Text style={[localStyles.deleteModalTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Êtes-vous sûr de vouloir supprimer le bordereau{' '}
                            <Text style={{ fontWeight: '700', color: tTheme.text }}>{slipToDelete?.slip_number}</Text> ?{' '}
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
    filtersContainer: { padding: 16, marginBottom: 16, borderRadius: 16, marginHorizontal: 16, marginTop: 16 },
    filterChips: { marginTop: 12 },
    actionsContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    actionButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    deleteButton: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
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
