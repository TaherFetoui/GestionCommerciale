import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { printFinanceDocument } from '../../services/pdfGenerator';
import { getGlobalStyles, themes } from '../../styles/GlobalStyles';

export default function ClientPaymentOrdersScreen() {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [clients, setClients] = useState([]);
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

    const [formOrderNumber, setFormOrderNumber] = useState('');
    const [formClient, setFormClient] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formPaymentMethod, setFormPaymentMethod] = useState('check');
    const [formBankAccount, setFormBankAccount] = useState('');
    const [formReceiptDate, setFormReceiptDate] = useState('');
    const [formInvoiceRef, setFormInvoiceRef] = useState('');
    const [formStatus, setFormStatus] = useState('pending');
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
                    <ModernActionButton icon="add" label="Nouvel encaissement" onPress={handleCreateOrder} variant="primary" />
                </View>
            ),
        });
    }, [navigation]);

    const fetchOrders = useCallback(async () => {
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
        
        // Récupérer les ordres de paiement
        const { data, error } = await supabase
            .from('client_payment_orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) console.error('Error:', error);
        else {
            setOrders(data || []);
            applyFilters(data || [], searchQuery, statusFilter);
        }
        setLoading(false);
    }, [searchQuery, statusFilter]);

    useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));
    const onRefresh = useCallback(async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); }, [fetchOrders]);

    const applyFilters = useCallback((data, search, status) => {
        let filtered = [...data];
        if (search) filtered = filtered.filter(item => item.order_number?.toLowerCase().includes(search.toLowerCase()) || item.client?.toLowerCase().includes(search.toLowerCase()));
        if (status !== 'all') filtered = filtered.filter(item => item.status === status);
        setFilteredOrders(filtered);
    }, []);

    const handleSearch = useCallback((text) => { setSearchQuery(text); applyFilters(orders, text, statusFilter); }, [orders, statusFilter, applyFilters]);
    const handleStatusFilter = useCallback((status) => { setStatusFilter(status); applyFilters(orders, searchQuery, status); }, [orders, searchQuery, applyFilters]);

    const handleCreateOrder = useCallback(() => {
        setFormOrderNumber(`EC-${Date.now()}`);
        setFormClient('');
        setFormAmount('');
        setFormPaymentMethod('check');
        setFormBankAccount('');
        setFormReceiptDate('');
        setFormInvoiceRef('');
        setFormStatus('pending');
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditOrder = useCallback((item) => {
        setSelectedOrder(item);
        setFormOrderNumber(item.order_number || '');
        setFormClient(item.client || '');
        setFormAmount(item.amount?.toString() || '');
        setFormPaymentMethod(item.payment_method || 'check');
        setFormBankAccount(item.bank_account || '');
        setFormReceiptDate(item.payment_date || '');
        setFormInvoiceRef(item.reference || '');
        setFormStatus(item.status || 'pending');
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteOrder = useCallback((item) => { setSelectedOrder(item); setDeleteModalVisible(true); }, []);

    const confirmDelete = useCallback(async () => {
        if (!orderToDelete) return;
        setDeleteModalVisible(false);
        const { error } = await supabase.from('client_payment_orders').delete().eq('id', orderToDelete.id);
        if (error) {
            alert('Erreur lors de la suppression');
        } else {
            setOrders(prevOrders => prevOrders.filter(o => o.id !== orderToDelete.id));
        }
        setOrderToDelete(null);
    }, [orderToDelete]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setOrderToDelete(null);
    }, []);

    const handleSaveNewOrder = useCallback(async () => {
        if (!formClient || !formAmount) { alert('Champs obligatoires manquants'); return; }
        setSaveLoading(true);
        const { error } = await supabase.from('client_payment_orders').insert([{
            order_number: formOrderNumber,
            client: formClient,
            amount: parseFloat(formAmount),
            payment_method: formPaymentMethod,
            bank_account: formBankAccount,
            payment_date: formReceiptDate || null,
            reference: formInvoiceRef,
            status: formStatus,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) alert('Erreur');
        else { setCreateModalVisible(false); await fetchOrders(); }
        setSaveLoading(false);
    }, [formOrderNumber, formClient, formAmount, formPaymentMethod, formBankAccount, formReceiptDate, formInvoiceRef, formStatus, formNote, user, fetchOrders]);

    const handleUpdateOrder = useCallback(async () => {
        if (!selectedOrder) return;
        setSaveLoading(true);
        const { error } = await supabase.from('client_payment_orders').update({
            order_number: formOrderNumber,
            client: formClient,
            amount: parseFloat(formAmount),
            payment_method: formPaymentMethod,
            bank_account: formBankAccount,
            payment_date: formReceiptDate || null,
            reference: formInvoiceRef,
            status: formStatus,
            note: formNote,
        }).eq('id', selectedOrder.id);
        if (error) alert('Erreur');
        else { setEditModalVisible(false); setSelectedOrder(null); await fetchOrders(); }
        setSaveLoading(false);
    }, [selectedOrder, formOrderNumber, formClient, formAmount, formPaymentMethod, formBankAccount, formReceiptDate, formInvoiceRef, formStatus, formNote, fetchOrders]);

    const getStatusVariant = (status) => ({ pending: 'warning', received: 'success', cancelled: 'error' }[status] || 'default');
    const getStatusLabel = (status) => ({ pending: 'En attente', received: 'Reçu', cancelled: 'Annulé' }[status] || status);
    const getPaymentMethodLabel = (method) => ({ check: 'Chèque', transfer: 'Virement', cash: 'Espèces', card: 'Carte' }[method] || method);

    const tableColumns = [
        { 
            key: 'order_number', 
            label: 'N° Ordre', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.order_number || '-'}</Text>
        },
        { 
            key: 'client', 
            label: 'Client', 
            flex: 1.5,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.client || '-'}</Text>
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
                        onPress={(e) => { e.stopPropagation(); printFinanceDocument(item, 'client_payment', companyInfo); }}
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
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} value={formOrderNumber} editable={false} />
            
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
            <Text style={[styles.label, { color: tTheme.text }]}>Date de réception</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formReceiptDate} onChangeText={setFormReceiptDate} />
            <Text style={[styles.label, { color: tTheme.text }]}>Référence facture</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="N° facture" placeholderTextColor={tTheme.textSecondary} value={formInvoiceRef} onChangeText={setFormInvoiceRef} />
            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                {['pending', 'received', 'cancelled'].map(status => (
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
                    <ModernFilterChip label="En attente" active={statusFilter === 'pending'} onPress={() => handleStatusFilter('pending')} />
                    <ModernFilterChip label="Reçu" active={statusFilter === 'received'} onPress={() => handleStatusFilter('received')} />
                    <ModernFilterChip label="Annulé" active={statusFilter === 'cancelled'} onPress={() => handleStatusFilter('cancelled')} />
                </ScrollView>
            </View>
            <ModernTable columns={tableColumns} data={filteredOrders} loading={loading} emptyMessage="Aucun encaissement trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouvel encaissement</Text><TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
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
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier l'encaissement</Text><TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
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
                            Êtes-vous sûr de vouloir supprimer l'encaissement{' '}
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
