import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import {
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

// Native-only imports for PDF generation (future enhancement)
let RNHTMLtoPDF, RNPrint, Share;
if (Platform.OS !== 'web') {
    RNHTMLtoPDF = require('react-native-html-to-pdf').default;
    RNPrint = require('react-native-print').default;
    Share = require('react-native-share').default;
}

export default function PurchaseOrdersListScreen() {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    
    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        
        console.log('Fetching purchase orders for user:', user.id);
        
        // Fetch company info
        const { data: companyData } = await supabase
            .from('company_info')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (companyData) {
            setCompanyInfo(companyData);
        }
        
        // Fetch purchase orders - First try without relation to debug
        let { data, error } = await supabase
            .from('purchase_orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        console.log('Initial fetch result:', { dataCount: data?.length, error });
            
        // If we have data, try to enrich with supplier info
        if (data && data.length > 0) {
            const supplierIds = [...new Set(data.map(o => o.supplier_id).filter(Boolean))];
            console.log('Found supplier IDs:', supplierIds);
            
            if (supplierIds.length > 0) {
                const { data: suppliersData, error: suppliersError } = await supabase
                    .from('suppliers')
                    .select('id, name')
                    .in('id', supplierIds);
                    
                console.log('Suppliers fetch result:', { suppliersCount: suppliersData?.length, suppliersError });
                
                if (suppliersError) {
                    console.error('Error fetching suppliers:', suppliersError);
                }
                
                if (suppliersData) {
                    // Map suppliers to orders
                    data = data.map(order => ({
                        ...order,
                        suppliers: suppliersData.find(s => s.id === order.supplier_id) || null
                    }));
                }
            }
        }
            
        if (error) {
            console.error('Error fetching purchase orders:', error);
            Alert.alert(t.error || 'Erreur', error.message || 'Impossible de charger les commandes');
        } else {
            console.log('Purchase orders fetched:', data?.length || 0, 'orders');
            console.log('Sample order:', data?.[0]);
            setOrders(data || []);
            setFilteredOrders(data || []);
        }
        setLoading(false);
    }, [user, t.error]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreatePurchaseOrder')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouvelle commande</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    // Filter orders based on search and status
    React.useEffect(() => {
        let result = orders;

        // Filter by search query
        if (searchQuery) {
            result = result.filter(order =>
                order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(order => order.status === statusFilter);
        }

        setFilteredOrders(result);
    }, [searchQuery, statusFilter, orders]);

    // Handle print purchase order
    const handlePrintOrder = useCallback(async (order) => {
        if (!order.suppliers) {
            Alert.alert('Erreur', 'Informations fournisseur manquantes');
            return;
        }

        if (!companyInfo) {
            Alert.alert('Erreur', 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société');
            return;
        }

        // TODO: Implement PDF generation for purchase orders
        Alert.alert('Information', 'Fonctionnalité d\'impression en cours de développement');
    }, [companyInfo]);

    // Handle download/share purchase order
    const handleDownloadOrder = useCallback(async (order) => {
        if (!order.suppliers) {
            Alert.alert('Erreur', 'Informations fournisseur manquantes');
            return;
        }

        if (!companyInfo) {
            Alert.alert('Erreur', 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société');
            return;
        }

        // TODO: Implement PDF download for purchase orders
        Alert.alert('Information', 'Fonctionnalité de téléchargement en cours de développement');
    }, [companyInfo]);

    // Handle delete purchase order
    const handleDeleteOrder = useCallback((order) => {
        console.log('Delete button clicked for order:', order.order_number);
        setOrderToDelete(order);
        setDeleteModalVisible(true);
    }, []);

    // Confirm delete
    const confirmDelete = useCallback(async () => {
        if (!orderToDelete) return;
        
        console.log('Deleting purchase order:', orderToDelete.id);
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('purchase_orders')
                .delete()
                .eq('id', orderToDelete.id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Delete error:', error);
                Alert.alert('Erreur', error.message);
            } else {
                console.log('Purchase order deleted successfully');
                setOrders(prev => prev.filter(order => order.id !== orderToDelete.id));
                Alert.alert('✓ Succès', 'Commande supprimée avec succès');
            }
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Erreur', 'Impossible de supprimer la commande');
        }
        
        setOrderToDelete(null);
    }, [orderToDelete, user]);

    // Cancel delete
    const cancelDelete = useCallback(() => {
        console.log('Delete cancelled');
        setDeleteModalVisible(false);
        setOrderToDelete(null);
    }, []);

    const tableColumns = useMemo(() => {
        return [
            {
                key: 'order_number',
                label: 'N° Commande',
                flex: 1.2,
                render: (row) => (
                    <View>
                        <Text style={[localStyles.orderNumber, { color: tTheme.primary }]} numberOfLines={1}>
                            {row.order_number}
                        </Text>
                        <Text style={[localStyles.orderDate, { color: tTheme.textSecondary }]}>
                            {row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                        </Text>
                    </View>
                ),
            },
            {
                key: 'supplier',
                label: 'Fournisseur',
                flex: 1.5,
                render: (row) => (
                    <Text style={{ color: tTheme.text, fontWeight: '500' }} numberOfLines={1}>
                        {row.suppliers?.name || 'N/A'}
                    </Text>
                ),
            },
            {
                key: 'total_amount',
                label: 'Montant',
                flex: 1,
                render: (row) => (
                    <Text style={[localStyles.amount, { color: tTheme.text }]}>
                        {row.total_amount?.toFixed(3) || '0.000'} TND
                    </Text>
                ),
            },
            {
                key: 'status',
                label: 'Statut',
                flex: 1,
                render: (row) => {
                    const statusConfig = {
                        'pending': { label: 'En attente', variant: 'warning' },
                        'confirmed': { label: 'Confirmé', variant: 'info' },
                        'received': { label: 'Reçu', variant: 'success' },
                        'cancelled': { label: 'Annulé', variant: 'default' },
                    };
                    const config = statusConfig[row.status] || { label: 'En attente', variant: 'warning' };
                    return <ModernStatusBadge label={config.label} variant={config.variant} />;
                },
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
                                handlePrintOrder(row);
                            }}
                        >
                            <Ionicons name="print-outline" size={18} color={tTheme.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[localStyles.actionButton, { backgroundColor: '#10B981' + '15' }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDownloadOrder(row);
                            }}
                        >
                            <Ionicons name="download-outline" size={18} color="#10B981" />
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
                                console.log('Delete button pressed!');
                                handleDeleteOrder(row);
                            }}
                        >
                            <Ionicons name="trash" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ),
            },
        ];
    }, [tTheme, handlePrintOrder, handleDownloadOrder, handleDeleteOrder]);

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'pending', label: 'En attente' },
        { value: 'confirmed', label: 'Confirmé' },
        { value: 'received', label: 'Reçu' },
        { value: 'cancelled', label: 'Annulé' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher une commande..."
                        theme={theme}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChipsContainer}>
                        {filterOptions.map((filter) => (
                            <ModernFilterChip
                                key={filter.value}
                                label={filter.label}
                                active={statusFilter === filter.value}
                                onPress={() => setStatusFilter(filter.value)}
                                theme={theme}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Modern Table with horizontal scroll */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={localStyles.tableWrapper}
                    contentContainerStyle={{ minWidth: '100%' }}
                >
                    <View style={{ flex: 1, minWidth: isMobile ? 800 : '100%' }}>
                        <ModernTable
                            data={filteredOrders}
                            columns={tableColumns}
                            onRowPress={(order) => navigation.navigate('PurchaseOrderDetails', { order_id: order.id })}
                            theme={theme}
                            loading={loading}
                            emptyMessage="Aucune commande trouvée. Créez votre première commande d'achat."
                        />
                    </View>
                </ScrollView>
            </ScrollView>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                visible={deleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelDelete}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={[localStyles.modalContainer, { backgroundColor: tTheme.card }]}>
                        {/* Icon */}
                        <View style={[localStyles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={48} color="#DC2626" />
                        </View>

                        {/* Title */}
                        <Text style={[localStyles.modalTitle, { color: tTheme.text }]}>
                            Supprimer la commande
                        </Text>

                        {/* Message */}
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Êtes-vous sûr de vouloir supprimer la commande {orderToDelete?.order_number} ? Cette action est irréversible.
                        </Text>

                        {/* Buttons */}
                        <View style={localStyles.modalButtons}>
                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.cancelButton, { 
                                    backgroundColor: tTheme.background,
                                    borderColor: tTheme.border
                                }]}
                                onPress={cancelDelete}
                            >
                                <Text style={[localStyles.cancelButtonText, { color: tTheme.text }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[localStyles.modalButton, localStyles.confirmButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={localStyles.confirmButtonText}>
                                    Supprimer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    filtersContainer: {
        marginBottom: 20,
        gap: 12,
    },
    filterChipsContainer: {
        marginTop: 4,
    },
    tableWrapper: {
        marginBottom: 20,
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 12,
    },
    amount: {
        fontSize: 15,
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: '#DC2626',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});