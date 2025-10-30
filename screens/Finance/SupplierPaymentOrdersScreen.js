import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import { themes } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SupplierPaymentOrdersScreen() {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

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
        if (!selectedOrder) return;
        setSaveLoading(true);
        const { error } = await supabase.from('supplier_payment_orders').delete().eq('id', selectedOrder.id);
        if (error) alert('Erreur');
        else {
            setDeleteModalVisible(false);
            setSelectedOrder(null);
            await fetchOrders();
        }
        setSaveLoading(false);
    }, [selectedOrder, fetchOrders]);

    const handleSaveNewOrder = useCallback(async () => {
        if (!formSupplier || !formAmount) {
            alert('Veuillez remplir les champs obligatoires');
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
        if (error) alert('Erreur');
        else {
            setCreateModalVisible(false);
            await fetchOrders();
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
        if (error) alert('Erreur');
        else {
            setEditModalVisible(false);
            setSelectedOrder(null);
            await fetchOrders();
        }
        setSaveLoading(false);
    }, [selectedOrder, formOrderNumber, formSupplier, formAmount, formPaymentMethod, formBankAccount, formPaymentDate, formDueDate, formStatus, formNote, fetchOrders]);

    const tableColumns = [
        { key: 'order_number', label: 'N° Ordre', width: 140 },
        { key: 'supplier_name', label: 'Fournisseur', width: 180 },
        { key: 'amount', label: 'Montant', width: 120, align: 'right' },
        { key: 'payment_method', label: 'Méthode', width: 120 },
        { key: 'payment_date', label: 'Date', width: 120 },
        { key: 'status', label: 'Statut', width: 120 },
        { key: 'actions', label: 'Actions', width: 150 },
    ];

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

    const renderTableRow = (item) => ({
        order_number: item.order_number || '-',
        supplier_name: item.supplier_name || '-',
        amount: `${parseFloat(item.amount || 0).toFixed(3)} TND`,
        payment_method: getPaymentMethodLabel(item.payment_method),
        payment_date: item.payment_date || '-',
        status: <ModernStatusBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />,
        actions: (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditOrder(item)} style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '20' }]}>
                    <Ionicons name="pencil" size={16} color={tTheme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteOrder(item)} style={[localStyles.actionButton, { backgroundColor: '#ff444420' }]}>
                    <Ionicons name="trash" size={16} color="#ff4444" />
                </TouchableOpacity>
            </View>
        ),
    });

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

            <ModernTable columns={tableColumns} data={filteredOrders} renderRow={renderTableRow} loading={loading} emptyMessage="Aucun ordre trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />

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

            <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.deleteModal, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <Ionicons name="warning" size={48} color="#ff4444" />
                        <Text style={[localStyles.deleteTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.deleteMessage, { color: tTheme.textSecondary }]}>Supprimer cet ordre de paiement ?</Text>
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
    methodButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    methodButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    methodButtonText: { fontSize: 13, fontWeight: '600' },
    statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    statusButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    statusButtonText: { fontSize: 13, fontWeight: '600' },
    deleteModal: { width: '90%', maxWidth: 400, borderRadius: 24, padding: 24, alignItems: 'center' },
    deleteTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    deleteMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    deleteActions: { flexDirection: 'row', gap: 12, width: '100%' },
});
