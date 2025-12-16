import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CashSessionScreen() {
    const navigation = useNavigation();
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const [formSessionNumber, setFormSessionNumber] = useState('');
    const [formCashBoxName, setFormCashBoxName] = useState('');
    const [formOpeningBalance, setFormOpeningBalance] = useState('');
    const [formClosingBalance, setFormClosingBalance] = useState('');
    const [formOpeningDate, setFormOpeningDate] = useState('');
    const [formClosingDate, setFormClosingDate] = useState('');
    const [formStatus, setFormStatus] = useState('open');
    const [formNote, setFormNote] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    const { theme, user } = useAuth();
    const tTheme = themes[theme];
    const styles = getGlobalStyles(theme);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
                    <ModernActionButton icon="add" label="Nouvelle session" onPress={handleCreateSession} variant="primary" />
                </View>
            ),
        });
    }, [navigation]);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('cash_sessions').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error:', error);
        else {
            setSessions(data || []);
            applyFilters(data || [], searchQuery, statusFilter);
        }
        setLoading(false);
    }, [searchQuery, statusFilter]);

    useFocusEffect(useCallback(() => { fetchSessions(); }, [fetchSessions]));
    const onRefresh = useCallback(async () => { setRefreshing(true); await fetchSessions(); setRefreshing(false); }, [fetchSessions]);

    const applyFilters = useCallback((data, search, status) => {
        let filtered = [...data];
        if (search) filtered = filtered.filter(item => item.session_number?.toLowerCase().includes(search.toLowerCase()) || item.cash_box_name?.toLowerCase().includes(search.toLowerCase()));
        if (status !== 'all') filtered = filtered.filter(item => item.status === status);
        setFilteredSessions(filtered);
    }, []);

    const handleSearch = useCallback((text) => { setSearchQuery(text); applyFilters(sessions, text, statusFilter); }, [sessions, statusFilter, applyFilters]);
    const handleStatusFilter = useCallback((status) => { setStatusFilter(status); applyFilters(sessions, searchQuery, status); }, [sessions, searchQuery, applyFilters]);

    const handleCreateSession = useCallback(() => {
        const now = new Date().toISOString().split('T')[0];
        setFormSessionNumber(`CS-${Date.now()}`);
        setFormCashBoxName('');
        setFormOpeningBalance('');
        setFormClosingBalance('');
        setFormOpeningDate(now);
        setFormClosingDate('');
        setFormStatus('open');
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditSession = useCallback((item) => {
        setSelectedSession(item);
        setFormSessionNumber(item.session_number || '');
        setFormCashBoxName(item.cash_box_name || '');
        setFormOpeningBalance(item.opening_balance?.toString() || '');
        setFormClosingBalance(item.closing_balance?.toString() || '');
        setFormOpeningDate(item.opening_date || '');
        setFormClosingDate(item.closing_date || '');
        setFormStatus(item.status || 'open');
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteSession = useCallback((item) => { setSelectedSession(item); setDeleteModalVisible(true); }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedSession) return;
        setSaveLoading(true);
        const { error } = await supabase.from('cash_sessions').delete().eq('id', selectedSession.id);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la suppression', type: 'error' });
        } else {
            setDeleteModalVisible(false);
            setSelectedSession(null);
            await fetchSessions();
            setToast({ visible: true, message: 'Session de caisse supprimée avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [selectedSession, fetchSessions]);

    const handleSaveNewSession = useCallback(async () => {
        if (!formCashBoxName || !formOpeningBalance) {
            setToast({ visible: true, message: 'Champs obligatoires manquants', type: 'warning' });
            return;
        }
        setSaveLoading(true);
        const { error } = await supabase.from('cash_sessions').insert([{
            session_number: formSessionNumber,
            cash_box_name: formCashBoxName,
            opening_balance: parseFloat(formOpeningBalance),
            closing_balance: formClosingBalance ? parseFloat(formClosingBalance) : null,
            opening_date: formOpeningDate,
            closing_date: formClosingDate || null,
            status: formStatus,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la création', type: 'error' });
        } else {
            setCreateModalVisible(false);
            await fetchSessions();
            setToast({ visible: true, message: 'Session de caisse créée avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [formSessionNumber, formCashBoxName, formOpeningBalance, formClosingBalance, formOpeningDate, formClosingDate, formStatus, formNote, user, fetchSessions]);

    const handleUpdateSession = useCallback(async () => {
        if (!selectedSession) return;
        setSaveLoading(true);
        const { error } = await supabase.from('cash_sessions').update({
            session_number: formSessionNumber,
            cash_box_name: formCashBoxName,
            opening_balance: parseFloat(formOpeningBalance),
            closing_balance: formClosingBalance ? parseFloat(formClosingBalance) : null,
            opening_date: formOpeningDate,
            closing_date: formClosingDate || null,
            status: formStatus,
            note: formNote,
        }).eq('id', selectedSession.id);
        if (error) {
            setToast({ visible: true, message: 'Erreur lors de la modification', type: 'error' });
        } else {
            setEditModalVisible(false);
            setSelectedSession(null);
            await fetchSessions();
            setToast({ visible: true, message: 'Session de caisse modifiée avec succès', type: 'success' });
        }
        setSaveLoading(false);
    }, [selectedSession, formSessionNumber, formCashBoxName, formOpeningBalance, formClosingBalance, formOpeningDate, formClosingDate, formStatus, formNote, fetchSessions]);

    const tableColumns = [
        { key: 'session_number', label: 'N° Session', width: 150 },
        { key: 'cash_box_name', label: 'Caisse', width: 150 },
        { key: 'opening_balance', label: 'Ouverture', width: 120, align: 'right' },
        { key: 'closing_balance', label: 'Fermeture', width: 120, align: 'right' },
        { key: 'difference', label: 'Différence', width: 120, align: 'right' },
        { key: 'opening_date', label: 'Date ouv.', width: 120 },
        { key: 'status', label: 'Statut', width: 100 },
        { key: 'actions', label: 'Actions', width: 150 },
    ];

    const getStatusVariant = (status) => ({ open: 'warning', closed: 'success' }[status] || 'default');
    const getStatusLabel = (status) => ({ open: 'Ouverte', closed: 'Fermée' }[status] || status);

    const renderTableRow = (item) => {
        const diff = (item.closing_balance || 0) - (item.opening_balance || 0);
        return {
            session_number: item.session_number || '-',
            cash_box_name: item.cash_box_name || '-',
            opening_balance: `${parseFloat(item.opening_balance || 0).toFixed(3)}`,
            closing_balance: item.closing_balance ? `${parseFloat(item.closing_balance).toFixed(3)}` : '-',
            difference: item.closing_balance ? `${diff.toFixed(3)}` : '-',
            opening_date: item.opening_date || '-',
            status: <ModernStatusBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />,
            actions: (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleEditSession(item)} style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '20' }]}><Ionicons name="pencil" size={16} color={tTheme.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSession(item)} style={[localStyles.actionButton, { backgroundColor: '#ff444420' }]}><Ionicons name="trash" size={16} color="#ff4444" /></TouchableOpacity>
                </View>
            ),
        };
    };

    const renderForm = () => (
        <ScrollView style={{ maxHeight: 500 }}>
            <Text style={[styles.label, { color: tTheme.text }]}>N° Session</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} value={formSessionNumber} editable={false} />
            <Text style={[styles.label, { color: tTheme.text }]}>Caisse *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Nom de la caisse" placeholderTextColor={tTheme.textSecondary} value={formCashBoxName} onChangeText={setFormCashBoxName} />
            <Text style={[styles.label, { color: tTheme.text }]}>Solde d'ouverture *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="0.000" placeholderTextColor={tTheme.textSecondary} value={formOpeningBalance} onChangeText={setFormOpeningBalance} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: tTheme.text }]}>Solde de fermeture</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="0.000" placeholderTextColor={tTheme.textSecondary} value={formClosingBalance} onChangeText={setFormClosingBalance} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: tTheme.text }]}>Date d'ouverture</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formOpeningDate} onChangeText={setFormOpeningDate} />
            <Text style={[styles.label, { color: tTheme.text }]}>Date de fermeture</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formClosingDate} onChangeText={setFormClosingDate} />
            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                {['open', 'closed'].map(status => (
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
                    <ModernFilterChip label="Ouvertes" active={statusFilter === 'open'} onPress={() => handleStatusFilter('open')} />
                    <ModernFilterChip label="Fermées" active={statusFilter === 'closed'} onPress={() => handleStatusFilter('closed')} />
                </ScrollView>
            </View>
            <ModernTable columns={tableColumns} data={filteredSessions} renderRow={renderTableRow} loading={loading} emptyMessage="Aucune session trouvée" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouvelle session de caisse</Text><TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setCreateModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleSaveNewSession} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier la session</Text><TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setEditModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleUpdateSession} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.deleteModal, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <Ionicons name="warning" size={48} color="#ff4444" />
                        <Text style={[localStyles.deleteTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.deleteMessage, { color: tTheme.textSecondary }]}>Supprimer cette session de caisse ?</Text>
                        <View style={localStyles.deleteActions}>
                            <TouchableOpacity style={[styles.secondaryButton, { flex: 1, borderColor: tTheme.border }]} onPress={() => setDeleteModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: '#ff4444' }]} onPress={confirmDelete} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Suppression...' : 'Supprimer'}</Text></TouchableOpacity>
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
    actionButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    modalContent: { width: '90%', maxWidth: 700, maxHeight: '90%', borderRadius: 24, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalBody: { padding: 20 },
    modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    statusButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', minWidth: 100, alignItems: 'center' },
    statusButtonText: { fontSize: 13, fontWeight: '600' },
    deleteModal: { width: '90%', maxWidth: 400, borderRadius: 24, padding: 24, alignItems: 'center' },
    deleteTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    deleteMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    deleteActions: { flexDirection: 'row', gap: 12, width: '100%' },
});
