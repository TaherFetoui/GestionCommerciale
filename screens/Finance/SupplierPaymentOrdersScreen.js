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

export default function SupplierPaymentOrdersScreen() {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const [formOrderNumber, setFormOrderNumber] = useState('');
    const [formSupplier, setFormSupplier] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formPaymentMethod, setFormPaymentMethod] = useState('check');
    const [formBankAccount, setFormBankAccount] = useState('');
    const [formPaymentDate, setFormPaymentDate] = useState('');
    const [formDueDate, setFormDueDate] = useState('');
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
                    <ModernActionButton icon="add" label="Nouvel ordre" onPress={handleCreateOrder} variant="primary" />
                </View>
            ),
        });
    }, [navigation]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('supplier_payment_orders').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error:', error);
        else {
            setOrders(data || []);
            applyFilters(data || [], searchQuery, statusFilter);
        }
        setLoading(false);
    }, [searchQuery, statusFilter]);

    useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    const applyFilters = useCallback((data, search, status) => {
        let filtered = [...data];
        if (search) filtered = filtered.filter(item => item.order_number?.toLowerCase().includes(search.toLowerCase()) || item.supplier_name?.toLowerCase().includes(search.toLowerCase()));
        if (status !== 'all') filtered = filtered.filter(item => item.status === status);
        setFilteredOrders(filtered);
    }, []);

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        applyFilters(orders, text, statusFilter);
    }, [orders, statusFilter, applyFilters]);

    const handleStatusFilter = useCallback((status) => {
        setStatusFilter(status);
        applyFilters(orders, searchQuery, status);
    }, [orders, searchQuery, applyFilters]);

    const handleCreateOrder = useCallback(() => {
        setFormOrderNumber(`OP-${Date.now()}`);
        setFormSupplier('');
        setFormAmount('');
        setFormPaymentMethod('check');
        setFormBankAccount('');
        setFormPaymentDate('');
        setFormDueDate('');
        setFormStatus('draft');
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditOrder = useCallback((item) => {
        setSelectedOrder(item);
        setFormOrderNumber(item.order_number || '');
        setFormSupplier(item.supplier_name || '');
        setFormAmount(item.amount?.toString() || '');
        setFormPaymentMethod(item.payment_method || 'check');
        setFormBankAccount(item.bank_account || '');
        setFormPaymentDate(item.payment_date || '');
        setFormDueDate(item.due_date || '');
        setFormStatus(item.status || 'draft');
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteOrder = useCallback((item) => {
        setSelectedOrder(item);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!orderToDelete) return;
        setDeleteModalVisible(false);
        const { error } = await supabase.from('supplier_payment_orders').delete().eq('id', orderToDelete.id);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la suppression', type: 'error' });
        } else {
            setOrders(prevOrders => prevOrders.filter(o => o.id !== orderToDelete.id));
            setToast({ visible: true, message: 'Ordre de paiement supprimé avec succès', type: 'success' });
        }
        setOrderToDelete(null);
    }, [orderToDelete]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setOrderToDelete(null);
    }, []);

    const handleSaveNewOrder = useCallback(async () => {
        if (!formSupplier || !formAmount) {
            setToast({ visible: true, message: 'Veuillez remplir les champs obligatoires', type: 'warning' });
            return;
        }
        setSaveLoading(true);
        const { error } = await supabase.from('supplier_payment_orders').insert([{
            order_number: formOrderNumber,
            supplier_name: formSupplier,
            amount: parseFloat(formAmount),
            payment_method: formPaymentMethod,
            bank_account: formBankAccount,
            payment_date: formPaymentDate || null,
            due_date: formDueDate || null,
            status: formStatus,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la création', type: 'error' });
        } else {
            setCreateModalVisible(false);
            await fetchOrders();
            setToast({ visible: true, message: 'Ordre de paiement créé avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [formOrderNumber, formSupplier, formAmount, formPaymentMethod, formBankAccount, formPaymentDate, formDueDate, formStatus, formNote, user, fetchOrders]);

    const handleUpdateOrder = useCallback(async () => {
        if (!selectedOrder) return;
        setSaveLoading(true);
        const { error } = await supabase.from('supplier_payment_orders').update({
            order_number: formOrderNumber,
            supplier_name: formSupplier,
            amount: parseFloat(formAmount),
            payment_method: formPaymentMethod,
            bank_account: formBankAccount,
            payment_date: formPaymentDate || null,
            due_date: formDueDate || null,
            status: formStatus,
            note: formNote,
        }).eq('id', selectedOrder.id);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la modification', type: 'error' });
        } else {
            setEditModalVisible(false);
            setSelectedOrder(null);
            await fetchOrders();
            setToast({ visible: true, message: 'Ordre de paiement modifié avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [selectedOrder, formOrderNumber, formSupplier, formAmount, formPaymentMethod, formBankAccount, formPaymentDate, formDueDate, formStatus, formNote, fetchOrders]);

    const getStatusVariant = (status) => {
        const variants = { draft: 'default', pending: 'warning', approved: 'info', paid: 'success', rejected: 'error', cancelled: 'error' };
        return variants[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const labels = { draft: 'Brouillon', pending: 'En attente', approved: 'Approuvé', paid: 'Payé', rejected: 'Rejeté', cancelled: 'Annulé' };
        return labels[status] || status;
    };

    const getPaymentMethodLabel = (method) => {
        const methods = { check: 'Chèque', transfer: 'Virement', cash: 'Espèces', card: 'Carte' };
        return methods[method] || method;
    };

    const tableColumns = [
        { 
            key: 'order_number', 
            label: 'N° Ordre', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.order_number || '-'}</Text>
        },
        { 
            key: 'supplier_name', 
            label: 'Fournisseur', 
            flex: 1.5,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.supplier_name || '-'}</Text>
        },
        { 
            key: 'amount', 
            label: 'Montant', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text, textAlign: 'right' }}>{parseFloat(item.amount || 0).toFixed(3)} TND</Text>
        },
        { 
            key: 'payment_method', 
            label: 'Méthode', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text }}>{getPaymentMethodLabel(item.payment_method)}</Text>
        },
        { 
            key: 'payment_date', 
            label: 'Date', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.payment_date || '-'}</Text>
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
                        onPress={(e) => { e.stopPropagation(); printFinanceDocument(item, 'supplier_payment', companyInfo); }}
                    >
                        <Ionicons name="print-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                        onPress={(e) => { e.stopPropagation(); setOrderToDelete(item); setDeleteModalVisible(true); }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            )
        },
    ];

    const renderForm = () => (
        <ScrollView style={{ maxHeight: 500 }}>
            <Text style={[styles.label, { color: tTheme.text }]}>N° Ordre</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} value={formOrderNumber} onChangeText={setFormOrderNumber} editable={false} />

            <Text style={[styles.label, { color: tTheme.text }]}>Fournisseur *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Nom du fournisseur" placeholderTextColor={tTheme.textSecondary} value={formSupplier} onChangeText={setFormSupplier} />

            <Text style={[styles.label, { color: tTheme.text }]}>Montant *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="0.000" placeholderTextColor={tTheme.textSecondary} value={formAmount} onChangeText={setFormAmount} keyboardType="decimal-pad" />

            <Text style={[styles.label, { color: tTheme.text }]}>Méthode de paiement</Text>
            <View style={localStyles.methodButtons}>
                {['check', 'transfer', 'cash', 'card'].map(method => (
                    <TouchableOpacity key={method} style={[localStyles.methodButton, formPaymentMethod === method && { backgroundColor: tTheme.primary }]} onPress={() => setFormPaymentMethod(method)}>
                        <Text style={[localStyles.methodButtonText, formPaymentMethod === method && { color: '#FFF' }]}>{getPaymentMethodLabel(method)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.label, { color: tTheme.text }]}>Compte bancaire</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Compte" placeholderTextColor={tTheme.textSecondary} value={formBankAccount} onChangeText={setFormBankAccount} />

            <Text style={[styles.label, { color: tTheme.text }]}>Date de paiement</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formPaymentDate} onChangeText={setFormPaymentDate} />

            <Text style={[styles.label, { color: tTheme.text }]}>Date d'échéance</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formDueDate} onChangeText={setFormDueDate} />

            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                {['draft', 'pending', 'approved', 'paid', 'rejected', 'cancelled'].map(status => (
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
                    <ModernFilterChip label="En attente" active={statusFilter === 'pending'} onPress={() => handleStatusFilter('pending')} />
                    <ModernFilterChip label="Approuvé" active={statusFilter === 'approved'} onPress={() => handleStatusFilter('approved')} />
                    <ModernFilterChip label="Payé" active={statusFilter === 'paid'} onPress={() => handleStatusFilter('paid')} />
                </ScrollView>
            </View>

            <ModernTable columns={tableColumns} data={filteredOrders} loading={loading} emptyMessage="Aucun ordre trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />

            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouvel ordre de paiement</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity>
                        </View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setCreateModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleSaveNewOrder} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier l'ordre</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity>
                        </View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setEditModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleUpdateOrder} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text></TouchableOpacity>
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
                            Êtes-vous sûr de vouloir supprimer l'ordre de paiement{' '}
                            <Text style={{ fontWeight: '700', color: tTheme.text }}>{orderToDelete?.order_number}</Text> ?{' '}
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
    methodButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    methodButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    methodButtonText: { fontSize: 13, fontWeight: '600' },
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
