import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ModernActionButton, ModernFilterChip, ModernSearchBar, ModernStatusBadge, ModernTable } from '../../components/ModernUIComponents';
import { themes } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SupplierFiscalYearScreen() {
    const navigation = useNavigation();
    const [fiscalYears, setFiscalYears] = useState([]);
    const [filteredYears, setFilteredYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);

    const [formYearName, setFormYearName] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
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
                    <ModernActionButton icon="add" label="Nouvel exercice" onPress={handleCreateYear} variant="primary" />
                </View>
            ),
        });
    }, [navigation]);

    const fetchYears = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('fiscal_years').select('*').eq('entity_type', 'supplier').order('start_date', { ascending: false });
        if (error) console.error('Error:', error);
        else {
            setFiscalYears(data || []);
            applyFilters(data || [], searchQuery, statusFilter);
        }
        setLoading(false);
    }, [searchQuery, statusFilter]);

    useFocusEffect(useCallback(() => { fetchYears(); }, [fetchYears]));
    const onRefresh = useCallback(async () => { setRefreshing(true); await fetchYears(); setRefreshing(false); }, [fetchYears]);

    const applyFilters = useCallback((data, search, status) => {
        let filtered = [...data];
        if (search) filtered = filtered.filter(item => item.year_name?.toLowerCase().includes(search.toLowerCase()));
        if (status !== 'all') filtered = filtered.filter(item => item.status === status);
        setFilteredYears(filtered);
    }, []);

    const handleSearch = useCallback((text) => { setSearchQuery(text); applyFilters(fiscalYears, text, statusFilter); }, [fiscalYears, statusFilter, applyFilters]);
    const handleStatusFilter = useCallback((status) => { setStatusFilter(status); applyFilters(fiscalYears, searchQuery, status); }, [fiscalYears, searchQuery, applyFilters]);

    const handleCreateYear = useCallback(() => {
        const currentYear = new Date().getFullYear();
        setFormYearName(`${currentYear}`);
        setFormStartDate(`${currentYear}-01-01`);
        setFormEndDate(`${currentYear}-12-31`);
        setFormStatus('open');
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditYear = useCallback((item) => {
        setSelectedYear(item);
        setFormYearName(item.year_name || '');
        setFormStartDate(item.start_date || '');
        setFormEndDate(item.end_date || '');
        setFormStatus(item.status || 'open');
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteYear = useCallback((item) => { setSelectedYear(item); setDeleteModalVisible(true); }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedYear) return;
        setSaveLoading(true);
        const { error } = await supabase.from('fiscal_years').delete().eq('id', selectedYear.id);
        if (error) alert('Erreur');
        else { setDeleteModalVisible(false); setSelectedYear(null); await fetchYears(); }
        setSaveLoading(false);
    }, [selectedYear, fetchYears]);

    const handleSaveNewYear = useCallback(async () => {
        if (!formYearName || !formStartDate || !formEndDate) { alert('Champs obligatoires manquants'); return; }
        setSaveLoading(true);
        const { error } = await supabase.from('fiscal_years').insert([{
            year_name: formYearName,
            entity_type: 'supplier',
            start_date: formStartDate,
            end_date: formEndDate,
            status: formStatus,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) alert('Erreur');
        else { setCreateModalVisible(false); await fetchYears(); }
        setSaveLoading(false);
    }, [formYearName, formStartDate, formEndDate, formStatus, formNote, user, fetchYears]);

    const handleUpdateYear = useCallback(async () => {
        if (!selectedYear) return;
        setSaveLoading(true);
        const { error } = await supabase.from('fiscal_years').update({
            year_name: formYearName,
            start_date: formStartDate,
            end_date: formEndDate,
            status: formStatus,
            note: formNote,
        }).eq('id', selectedYear.id);
        if (error) alert('Erreur');
        else { setEditModalVisible(false); setSelectedYear(null); await fetchYears(); }
        setSaveLoading(false);
    }, [selectedYear, formYearName, formStartDate, formEndDate, formStatus, formNote, fetchYears]);

    const tableColumns = [
        { key: 'year_name', label: 'Exercice', width: 150 },
        { key: 'start_date', label: 'Début', width: 150 },
        { key: 'end_date', label: 'Fin', width: 150 },
        { key: 'status', label: 'Statut', width: 120 },
        { key: 'actions', label: 'Actions', width: 150 },
    ];

    const getStatusVariant = (status) => ({ open: 'success', closed: 'warning', locked: 'error' }[status] || 'default');
    const getStatusLabel = (status) => ({ open: 'Ouvert', closed: 'Fermé', locked: 'Verrouillé' }[status] || status);

    const renderTableRow = (item) => ({
        year_name: item.year_name || '-',
        start_date: item.start_date || '-',
        end_date: item.end_date || '-',
        status: <ModernStatusBadge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />,
        actions: (
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => handleEditYear(item)} style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '20' }]}><Ionicons name="pencil" size={16} color={tTheme.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteYear(item)} style={[localStyles.actionButton, { backgroundColor: '#ff444420' }]}><Ionicons name="trash" size={16} color="#ff4444" /></TouchableOpacity>
            </View>
        ),
    });

    const renderForm = () => (
        <ScrollView style={{ maxHeight: 500 }}>
            <Text style={[styles.label, { color: tTheme.text }]}>Nom de l'exercice *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="Ex: 2025" placeholderTextColor={tTheme.textSecondary} value={formYearName} onChangeText={setFormYearName} />
            <Text style={[styles.label, { color: tTheme.text }]}>Date de début *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formStartDate} onChangeText={setFormStartDate} />
            <Text style={[styles.label, { color: tTheme.text }]}>Date de fin *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]} placeholder="YYYY-MM-DD" placeholderTextColor={tTheme.textSecondary} value={formEndDate} onChangeText={setFormEndDate} />
            <Text style={[styles.label, { color: tTheme.text }]}>Statut</Text>
            <View style={localStyles.statusButtons}>
                {['open', 'closed', 'locked'].map(status => (
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
                    <ModernFilterChip label="Ouvert" active={statusFilter === 'open'} onPress={() => handleStatusFilter('open')} />
                    <ModernFilterChip label="Fermé" active={statusFilter === 'closed'} onPress={() => handleStatusFilter('closed')} />
                    <ModernFilterChip label="Verrouillé" active={statusFilter === 'locked'} onPress={() => handleStatusFilter('locked')} />
                </ScrollView>
            </View>
            <ModernTable columns={tableColumns} data={filteredYears} renderRow={renderTableRow} loading={loading} emptyMessage="Aucun exercice trouvé" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouvel exercice fiscal</Text><TouchableOpacity onPress={() => setCreateModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setCreateModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleSaveNewYear} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}><Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier l'exercice</Text><TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={24} color={tTheme.text} /></TouchableOpacity></View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setEditModalVisible(false)}><Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleUpdateYear} disabled={saveLoading}><Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.deleteModal, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <Ionicons name="warning" size={48} color="#ff4444" />
                        <Text style={[localStyles.deleteTitle, { color: tTheme.text }]}>Confirmer la suppression</Text>
                        <Text style={[localStyles.deleteMessage, { color: tTheme.textSecondary }]}>Supprimer cet exercice fiscal ?</Text>
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
    modalContent: { width: '90%', maxWidth: 600, maxHeight: '90%', borderRadius: 24, overflow: 'hidden' },
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
