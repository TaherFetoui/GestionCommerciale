import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
    ModernSearchBar,
    ModernTable,
} from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function SuppliersListScreen() {
    const navigation = useNavigation();
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
        } else {
            setSuppliers(data || []);
            setFilteredSuppliers(data || []);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchSuppliers();
        }, [fetchSuppliers])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateSupplier')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchSuppliers();
        setRefreshing(false);
    }, [fetchSuppliers]);

    // Filter suppliers based on search
    React.useEffect(() => {
        if (searchQuery) {
            setFilteredSuppliers(
                suppliers.filter(
                    (supplier) =>
                        supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        supplier.phone?.includes(searchQuery)
                )
            );
        } else {
            setFilteredSuppliers(suppliers);
        }
    }, [searchQuery, suppliers]);

    const confirmDeleteSupplier = useCallback(async () => {
        if (!supplierToDelete) return;
        
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', supplierToDelete.id);

            if (error) {
                setToast({ visible: true, message: error.message, type: 'error' });
            } else {
                setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierToDelete.id));
                setToast({ visible: true, message: 'Fournisseur supprimé avec succès', type: 'success' });
            }
        } catch (error) {
            setToast({ visible: true, message: 'Impossible de supprimer le fournisseur', type: 'error' });
        }
        
        setSupplierToDelete(null);
    }, [supplierToDelete, t.error]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setSupplierToDelete(null);
    }, []);

    const handleUpdateSupplier = useCallback(async () => {
        if (!selectedSupplier?.name) {
            setToast({ visible: true, message: 'Le nom est requis', type: 'warning' });
            return;
        }

        try {
            const { error } = await supabase
                .from('suppliers')
                .update({
                    name: selectedSupplier.name,
                    email: selectedSupplier.email,
                    phone: selectedSupplier.phone,
                    address: selectedSupplier.address,
                })
                .eq('id', selectedSupplier.id);

            if (error) {
                setToast({ visible: true, message: error.message, type: 'error' });
            } else {
                setToast({ visible: true, message: 'Fournisseur modifié avec succès', type: 'success' });
                setEditModalVisible(false);
                fetchSuppliers();
            }
        } catch (error) {
            setToast({ visible: true, message: 'Impossible de modifier le fournisseur', type: 'error' });
        }
    }, [selectedSupplier, t.error, fetchSuppliers]);

    const tableColumns = [
        {
            key: 'name',
            label: 'Nom',
            flex: 1.5,
            render: (row) => (
                <View>
                    <Text style={[localStyles.supplierName, { color: tTheme.text }]} numberOfLines={1}>
                        {row.name}
                    </Text>
                    {row.email && (
                        <Text style={[localStyles.supplierEmail, { color: tTheme.textSecondary }]} numberOfLines={1}>
                            {row.email}
                        </Text>
                    )}
                </View>
            ),
        },
        {
            key: 'phone',
            label: 'Téléphone',
            flex: 1,
            render: (row) => (
                <Text style={{ color: tTheme.text }} numberOfLines={1}>
                    {row.phone || 'N/A'}
                </Text>
            ),
        },
        {
            key: 'address',
            label: 'Adresse',
            flex: 1.5,
            render: (row) => (
                <Text style={{ color: tTheme.textSecondary }} numberOfLines={2}>
                    {row.address || 'Aucune adresse'}
                </Text>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            flex: 1,
            render: (row) => (
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            setSelectedSupplier(row);
                            setEditModalVisible(true);
                        }}
                    >
                        <Ionicons name="create-outline" size={18} color={tTheme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[localStyles.deleteButton, { 
                            backgroundColor: '#FEE2E2',
                            borderColor: '#EF4444'
                        }]}
                        onPress={(e) => {
                            if (e && e.stopPropagation) {
                                e.stopPropagation();
                            }
                            setSupplierToDelete(row);
                            setDeleteModalVisible(true);
                        }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                <View style={localStyles.searchContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher un fournisseur (nom, email, téléphone)..."
                        theme={theme}
                    />
                </View>

                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredSuppliers}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun fournisseur trouvé. Créez votre premier fournisseur."
                    />
                </View>
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelDelete}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card }]}>
                        <View style={[localStyles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>
                        <Text style={[localStyles.deleteModalTitle, { color: tTheme.text }]}>
                            Supprimer le fournisseur
                        </Text>
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Voulez-vous vraiment supprimer le fournisseur{'\n'}
                            <Text style={{ fontWeight: 'bold', color: tTheme.primary }}>
                                {supplierToDelete?.name}
                            </Text>
                            {'\n\n'}
                            <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                                Cette action est irréversible.
                            </Text>
                        </Text>
                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.cancelButton, { backgroundColor: tTheme.border }]}
                                onPress={cancelDelete}
                                activeOpacity={0.7}
                            >
                                <Text style={[localStyles.modalButtonText, { color: tTheme.text }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[localStyles.modalButton, { backgroundColor: '#DC2626' }]}
                                onPress={confirmDeleteSupplier}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash" size={18} color="#FFFFFF" />
                                <Text style={[localStyles.modalButtonText, { color: '#FFFFFF', marginLeft: 6 }]}>
                                    Supprimer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.editModalContainer, { backgroundColor: tTheme.card, borderColor: tTheme.border }]}>
                        <View style={[localStyles.modalHeader, { borderBottomColor: tTheme.border }]}>
                            <Text style={[styles.title, { color: tTheme.text }]}>Modifier le fournisseur</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={tTheme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={localStyles.modalBody}>
                            <Text style={[styles.label, { color: tTheme.text }]}>Nom *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedSupplier?.name}
                                onChangeText={(val) => setSelectedSupplier(prev => ({ ...prev, name: val }))}
                            />
                            <Text style={[styles.label, { color: tTheme.text }]}>Email</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedSupplier?.email}
                                onChangeText={(val) => setSelectedSupplier(prev => ({ ...prev, email: val }))}
                                keyboardType="email-address"
                            />
                            <Text style={[styles.label, { color: tTheme.text }]}>Téléphone</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedSupplier?.phone}
                                onChangeText={(val) => setSelectedSupplier(prev => ({ ...prev, phone: val }))}
                                keyboardType="phone-pad"
                            />
                            <Text style={[styles.label, { color: tTheme.text }]}>Adresse</Text>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: tTheme.card, color: tTheme.text, borderColor: tTheme.border }]}
                                value={selectedSupplier?.address}
                                onChangeText={(val) => setSelectedSupplier(prev => ({ ...prev, address: val }))}
                                multiline
                            />
                        </ScrollView>
                        <View style={[localStyles.modalFooter, { borderTopColor: tTheme.border }]}>
                            <TouchableOpacity
                                style={[localStyles.saveButton, { backgroundColor: tTheme.primary }]}
                                onPress={handleUpdateSupplier}
                                activeOpacity={0.7}
                            >
                                <Text style={[localStyles.saveButtonText, { color: '#FFFFFF' }]}>
                                    Enregistrer
                                </Text>
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
    headerButton: {
        marginRight: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    scrollContent: {
        padding: 20,
    },
    searchContainer: {
        marginBottom: 20,
    },
    tableWrapper: {
        marginBottom: 20,
    },
    supplierName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    supplierEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    deleteModalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    deleteModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    editModalContainer: {
        width: '90%',
        maxWidth: 600,
        maxHeight: '80%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalBody: {
        padding: 20,
        maxHeight: 400,
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
    },
    saveButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});