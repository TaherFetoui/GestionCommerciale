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
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { printFinanceDocument } from '../../services/pdfGenerator';
import { getGlobalStyles, themes } from '../../styles/GlobalStyles';

export default function BankAccountsScreen() {
    const navigation = useNavigation();
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [accountToDelete, setAccountToDelete] = useState(null);

    // Form states
    const [formAccountType, setFormAccountType] = useState('bank');
    const [formAccountName, setFormAccountName] = useState('');
    const [formAccountNumber, setFormAccountNumber] = useState('');
    const [formBankName, setFormBankName] = useState('');
    const [formBranchName, setFormBranchName] = useState('');
    const [formRIB, setFormRIB] = useState('');
    const [formIBAN, setFormIBAN] = useState('');
    const [formSwiftCode, setFormSwiftCode] = useState('');
    const [formCurrency, setFormCurrency] = useState('TND');
    const [formOpeningBalance, setFormOpeningBalance] = useState('0');
    const [formCurrentBalance, setFormCurrentBalance] = useState('0');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formNote, setFormNote] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);

    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
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
                    <ModernActionButton
                        icon="add"
                        label="Nouveau compte"
                        onPress={handleCreateAccount}
                        variant="primary"
                    />
                </View>
            ),
        });
    }, [navigation]);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching bank accounts:', error);
        } else {
            setAccounts(data || []);
            applyFilters(data || [], searchQuery, typeFilter);
        }
        setLoading(false);
    }, [searchQuery, typeFilter]);

    useFocusEffect(
        useCallback(() => {
            fetchAccounts();
        }, [fetchAccounts])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAccounts();
        setRefreshing(false);
    }, [fetchAccounts]);

    const applyFilters = useCallback((data, search, type) => {
        let filtered = [...data];
        if (search) {
            filtered = filtered.filter(item =>
                item.account_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.bank_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.account_number?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (type !== 'all') {
            filtered = filtered.filter(item => item.account_type === type);
        }
        setFilteredAccounts(filtered);
    }, []);

    const handleSearch = useCallback((text) => {
        setSearchQuery(text);
        applyFilters(accounts, text, typeFilter);
    }, [accounts, typeFilter, applyFilters]);

    const handleTypeFilter = useCallback((type) => {
        setTypeFilter(type);
        applyFilters(accounts, searchQuery, type);
    }, [accounts, searchQuery, applyFilters]);

    const handleCreateAccount = useCallback(() => {
        setFormAccountType('bank');
        setFormAccountName('');
        setFormAccountNumber('');
        setFormBankName('');
        setFormBranchName('');
        setFormRIB('');
        setFormIBAN('');
        setFormSwiftCode('');
        setFormCurrency('TND');
        setFormOpeningBalance('0');
        setFormCurrentBalance('0');
        setFormIsActive(true);
        setFormNote('');
        setCreateModalVisible(true);
    }, []);

    const handleEditAccount = useCallback((item) => {
        setSelectedAccount(item);
        setFormAccountType(item.account_type || 'bank');
        setFormAccountName(item.account_name || '');
        setFormAccountNumber(item.account_number || '');
        setFormBankName(item.bank_name || '');
        setFormBranchName(item.branch_name || '');
        setFormRIB(item.rib || '');
        setFormIBAN(item.iban || '');
        setFormSwiftCode(item.swift_code || '');
        setFormCurrency(item.currency || 'TND');
        setFormOpeningBalance(item.opening_balance?.toString() || '0');
        setFormCurrentBalance(item.current_balance?.toString() || '0');
        setFormIsActive(item.is_active !== false);
        setFormNote(item.note || '');
        setEditModalVisible(true);
    }, []);

    const handleDeleteAccount = useCallback((item) => {
        setSelectedAccount(item);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!accountToDelete) return;
        setDeleteModalVisible(false);
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', accountToDelete.id);
        if (error) {
            console.error('Error deleting account:', error);
            alert('Erreur lors de la suppression');
        } else {
            setAccounts(prevAccounts => prevAccounts.filter(a => a.id !== accountToDelete.id));
        }
        setAccountToDelete(null);
    }, [accountToDelete]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setAccountToDelete(null);
    }, []);

    const handleSaveNewAccount = useCallback(async () => {
        if (!formAccountName) {
            alert('Veuillez remplir le nom du compte');
            return;
        }
        setSaveLoading(true);
        const { error } = await supabase.from('bank_accounts').insert([{
            account_type: formAccountType,
            account_name: formAccountName,
            account_number: formAccountNumber,
            bank_name: formBankName,
            branch_name: formBranchName,
            rib: formRIB,
            iban: formIBAN,
            swift_code: formSwiftCode,
            currency: formCurrency,
            opening_balance: parseFloat(formOpeningBalance),
            current_balance: parseFloat(formCurrentBalance),
            is_active: formIsActive,
            note: formNote,
            created_by: user?.id,
        }]);
        if (error) {
            console.error('Error creating account:', error);
            alert('Erreur lors de la création');
        } else {
            setCreateModalVisible(false);
            await fetchAccounts();
        }
        setSaveLoading(false);
    }, [formAccountType, formAccountName, formAccountNumber, formBankName, formBranchName, formRIB, formIBAN, formSwiftCode, formCurrency, formOpeningBalance, formCurrentBalance, formIsActive, formNote, user, fetchAccounts]);

    const handleUpdateAccount = useCallback(async () => {
        if (!selectedAccount) return;
        setSaveLoading(true);
        const { error } = await supabase
            .from('bank_accounts')
            .update({
                account_type: formAccountType,
                account_name: formAccountName,
                account_number: formAccountNumber,
                bank_name: formBankName,
                branch_name: formBranchName,
                rib: formRIB,
                iban: formIBAN,
                swift_code: formSwiftCode,
                currency: formCurrency,
                opening_balance: parseFloat(formOpeningBalance),
                current_balance: parseFloat(formCurrentBalance),
                is_active: formIsActive,
                note: formNote,
            })
            .eq('id', selectedAccount.id);
        if (error) {
            console.error('Error updating account:', error);
            alert('Erreur lors de la modification');
        } else {
            setEditModalVisible(false);
            setSelectedAccount(null);
            await fetchAccounts();
        }
        setSaveLoading(false);
    }, [selectedAccount, formAccountType, formAccountName, formAccountNumber, formBankName, formBranchName, formRIB, formIBAN, formSwiftCode, formCurrency, formOpeningBalance, formCurrentBalance, formIsActive, formNote, fetchAccounts]);

    const getAccountTypeLabel = (type) => {
        const types = {
            bank: 'Banque',
            cash_box: 'Caisse',
            mobile_money: 'Mobile Money'
        };
        return types[type] || type;
    };

    const tableColumns = [
        { 
            key: 'account_name', 
            label: 'Nom du compte', 
            flex: 1.5,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.account_name || '-'}</Text>
        },
        { 
            key: 'account_type', 
            label: 'Type', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text }}>{getAccountTypeLabel(item.account_type)}</Text>
        },
        { 
            key: 'bank_name', 
            label: 'Banque', 
            flex: 1.5,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.bank_name || '-'}</Text>
        },
        { 
            key: 'account_number', 
            label: 'Numéro', 
            flex: 1.2,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.account_number || '-'}</Text>
        },
        { 
            key: 'current_balance', 
            label: 'Solde', 
            flex: 1,
            render: (item) => <Text style={{ color: tTheme.text, textAlign: 'right' }}>{parseFloat(item.current_balance || 0).toFixed(3)}</Text>
        },
        { 
            key: 'currency', 
            label: 'Devise', 
            flex: 0.6,
            render: (item) => <Text style={{ color: tTheme.text }}>{item.currency || 'TND'}</Text>
        },
        { 
            key: 'is_active', 
            label: 'Statut', 
            flex: 0.8,
            render: (item) => <ModernStatusBadge label={item.is_active ? 'Actif' : 'Inactif'} variant={item.is_active ? 'success' : 'error'} />
        },
        { 
            key: 'actions', 
            label: 'Actions', 
            flex: 1,
            render: (item) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                        onPress={(e) => { e.stopPropagation(); printFinanceDocument(item, 'bank_account', companyInfo); }}
                    >
                        <Ionicons name="print-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                        onPress={(e) => { e.stopPropagation(); setAccountToDelete(item); setDeleteModalVisible(true); }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            )
        },
    ];

    const renderForm = () => (
        <ScrollView style={{ maxHeight: 500 }}>
            <Text style={[styles.label, { color: tTheme.text }]}>Type de compte *</Text>
            <View style={localStyles.typeButtons}>
                <TouchableOpacity
                    style={[localStyles.typeButton, formAccountType === 'bank' && { backgroundColor: tTheme.primary }]}
                    onPress={() => setFormAccountType('bank')}
                >
                    <Ionicons name="business" size={20} color={formAccountType === 'bank' ? '#FFF' : tTheme.text} />
                    <Text style={[localStyles.typeButtonText, formAccountType === 'bank' && { color: '#FFF' }]}>Banque</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[localStyles.typeButton, formAccountType === 'cash_box' && { backgroundColor: tTheme.primary }]}
                    onPress={() => setFormAccountType('cash_box')}
                >
                    <Ionicons name="cash" size={20} color={formAccountType === 'cash_box' ? '#FFF' : tTheme.text} />
                    <Text style={[localStyles.typeButtonText, formAccountType === 'cash_box' && { color: '#FFF' }]}>Caisse</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[localStyles.typeButton, formAccountType === 'mobile_money' && { backgroundColor: tTheme.primary }]}
                    onPress={() => setFormAccountType('mobile_money')}
                >
                    <Ionicons name="phone-portrait" size={20} color={formAccountType === 'mobile_money' ? '#FFF' : tTheme.text} />
                    <Text style={[localStyles.typeButtonText, formAccountType === 'mobile_money' && { color: '#FFF' }]}>Mobile</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: tTheme.text }]}>Nom du compte *</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="Ex: Compte principal"
                placeholderTextColor={tTheme.textSecondary}
                value={formAccountName}
                onChangeText={setFormAccountName}
            />

            {formAccountType === 'bank' && (
                <>
                    <Text style={[styles.label, { color: tTheme.text }]}>Nom de la banque</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                        placeholder="Ex: Banque Nationale"
                        placeholderTextColor={tTheme.textSecondary}
                        value={formBankName}
                        onChangeText={setFormBankName}
                    />

                    <Text style={[styles.label, { color: tTheme.text }]}>Agence</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                        placeholder="Ex: Agence Centre Ville"
                        placeholderTextColor={tTheme.textSecondary}
                        value={formBranchName}
                        onChangeText={setFormBranchName}
                    />

                    <Text style={[styles.label, { color: tTheme.text }]}>Numéro de compte</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                        placeholder="Numéro de compte"
                        placeholderTextColor={tTheme.textSecondary}
                        value={formAccountNumber}
                        onChangeText={setFormAccountNumber}
                    />

                    <Text style={[styles.label, { color: tTheme.text }]}>RIB (20 chiffres)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                        placeholder="20 chiffres"
                        placeholderTextColor={tTheme.textSecondary}
                        value={formRIB}
                        onChangeText={setFormRIB}
                        keyboardType="numeric"
                        maxLength={20}
                    />

                    <Text style={[styles.label, { color: tTheme.text }]}>IBAN</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                        placeholder="IBAN international"
                        placeholderTextColor={tTheme.textSecondary}
                        value={formIBAN}
                        onChangeText={setFormIBAN}
                    />

                    <Text style={[styles.label, { color: tTheme.text }]}>Code SWIFT/BIC</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                        placeholder="Code SWIFT"
                        placeholderTextColor={tTheme.textSecondary}
                        value={formSwiftCode}
                        onChangeText={setFormSwiftCode}
                    />
                </>
            )}

            <Text style={[styles.label, { color: tTheme.text }]}>Solde d'ouverture</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="0.000"
                placeholderTextColor={tTheme.textSecondary}
                value={formOpeningBalance}
                onChangeText={setFormOpeningBalance}
                keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Solde actuel</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="0.000"
                placeholderTextColor={tTheme.textSecondary}
                value={formCurrentBalance}
                onChangeText={setFormCurrentBalance}
                keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: tTheme.text }]}>Devise</Text>
            <TextInput
                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="TND"
                placeholderTextColor={tTheme.textSecondary}
                value={formCurrency}
                onChangeText={setFormCurrency}
            />

            <TouchableOpacity
                style={[localStyles.checkboxContainer, { borderColor: tTheme.border }]}
                onPress={() => setFormIsActive(!formIsActive)}
            >
                <Ionicons name={formIsActive ? "checkbox" : "square-outline"} size={24} color={tTheme.primary} />
                <Text style={[localStyles.checkboxLabel, { color: tTheme.text }]}>Compte actif</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { color: tTheme.text }]}>Note</Text>
            <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                placeholder="Notes optionnelles..."
                placeholderTextColor={tTheme.textSecondary}
                value={formNote}
                onChangeText={setFormNote}
                multiline
                numberOfLines={3}
            />
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <View style={[localStyles.filtersContainer, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                <ModernSearchBar
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholder="Rechercher un compte..."
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChips}>
                    <ModernFilterChip label="Tous" active={typeFilter === 'all'} onPress={() => handleTypeFilter('all')} />
                    <ModernFilterChip label="Banques" active={typeFilter === 'bank'} onPress={() => handleTypeFilter('bank')} />
                    <ModernFilterChip label="Caisses" active={typeFilter === 'cash_box'} onPress={() => handleTypeFilter('cash_box')} />
                    <ModernFilterChip label="Mobile Money" active={typeFilter === 'mobile_money'} onPress={() => handleTypeFilter('mobile_money')} />
                </ScrollView>
            </View>

            <ModernTable
                columns={tableColumns}
                data={filteredAccounts}
                loading={loading}
                emptyMessage="Aucun compte trouvé"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

            {/* Create Modal */}
            <Modal visible={createModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Nouveau compte</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setCreateModalVisible(false)}>
                                <Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleSaveNewAccount} disabled={saveLoading}>
                                <Text style={styles.primaryButtonText}>{saveLoading ? 'Enregistrement...' : 'Enregistrer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={[styles.overlay, { backgroundColor: tTheme.overlay }]}>
                    <View style={[localStyles.modalContent, { backgroundColor: tTheme.card, ...tTheme.shadow.large }]}>
                        <View style={localStyles.modalHeader}>
                            <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>Modifier le compte</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={localStyles.modalBody}>{renderForm()}</View>
                        <View style={localStyles.modalFooter}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: tTheme.border }]} onPress={() => setEditModalVisible(false)}>
                                <Text style={[styles.primaryButtonText, { color: tTheme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tTheme.primary }]} onPress={handleUpdateAccount} disabled={saveLoading}>
                                <Text style={styles.primaryButtonText}>{saveLoading ? 'Mise à jour...' : 'Mettre à jour'}</Text>
                            </TouchableOpacity>
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
                            Êtes-vous sûr de vouloir supprimer le compte{' '}
                            <Text style={{ fontWeight: '700', color: tTheme.text }}>{accountToDelete?.account_number}</Text> ?{' '}
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
    typeButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    typeButton: { flex: 1, flexDirection: 'row', gap: 8, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
    typeButtonText: { fontSize: 14, fontWeight: '600' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
    checkboxLabel: { fontSize: 15, fontWeight: '500' },
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
