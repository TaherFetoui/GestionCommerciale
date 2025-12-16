import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModernStatusBadge } from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function PurchaseOrderDetailsScreen({ route, navigation }) {
    const { order_id } = route.params;
    const [order, setOrder] = useState(null);
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusMenuVisible, setStatusMenuVisible] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const statusOptions = [
        { value: 'pending', label: 'En attente', variant: 'warning' },
        { value: 'confirmed', label: 'Confirmé', variant: 'info' },
        { value: 'received', label: 'Reçu', variant: 'success' },
        { value: 'cancelled', label: 'Annulé', variant: 'default' },
    ];

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);
            
            // Fetch purchase order
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .eq('id', order_id)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching order:', error);
                setToast({ visible: true, message: 'Impossible de charger les détails de la commande', type: 'error' });
            } else if (data) {
                // Fetch supplier separately if supplier_id exists
                if (data.supplier_id) {
                    const { data: supplierData, error: supplierError } = await supabase
                        .from('suppliers')
                        .select('*')
                        .eq('id', data.supplier_id)
                        .single();
                    
                    if (!supplierError && supplierData) {
                        setSupplier(supplierData);
                    }
                }
                setOrder(data);
            }
            setLoading(false);
        };

        fetchOrderDetails();
    }, [order_id, user, t.error]);

    const handleStatusChange = useCallback(async (newStatus) => {
        try {
            const { error } = await supabase
                .from('purchase_orders')
                .update({ status: newStatus })
                .eq('id', order_id);

            if (error) {
                setToast({ visible: true, message: 'Impossible de mettre à jour le statut', type: 'error' });
                console.error(error);
            } else {
                setOrder(prev => ({ ...prev, status: newStatus }));
                setStatusMenuVisible(false);
                setToast({ visible: true, message: 'Statut mis à jour avec succès', type: 'success' });
            }
        } catch (error) {
            console.error('Status update error:', error);
            setToast({ visible: true, message: 'Une erreur est survenue', type: 'error' });
        }
    }, [order_id, t.error]);

    const formatNumber = (num) => parseFloat(num || 0).toFixed(3);

    if (loading) {
        return (
            <View style={[styles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[localStyles.loadingText, { color: tTheme.textSecondary }]}>Chargement...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <Ionicons name="document-text-outline" size={64} color={tTheme.textSecondary} />
                <Text style={[localStyles.emptyText, { color: tTheme.text }]}>Commande introuvable</Text>
            </View>
        );
    }

    const items = order.items || [];
    
    // Calculate totals from items
    const totalHT = items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.purchase_price || item.unit_price) || 0;
        return sum + (quantity * price);
    }, 0);
    
    const totalVAT = totalHT * 0.19; // 19% VAT
    const fiscalStamp = parseFloat(order.fiscal_stamp) || 0;
    const totalTTC = totalHT + totalVAT + fiscalStamp;

    const currentStatus = statusOptions.find(s => s.value === order.status) || statusOptions[0];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Card */}
                <View style={[localStyles.headerCard, { backgroundColor: tTheme.card, ...tTheme.shadow.medium }]}>
                    <View style={localStyles.headerTop}>
                        <View style={localStyles.headerLeft}>
                            <Text style={[localStyles.orderLabel, { color: tTheme.textSecondary }]}>Commande</Text>
                            <Text style={[localStyles.orderNumber, { color: tTheme.primary }]}>
                                {order.order_number}
                            </Text>
                            <Text style={[localStyles.orderDate, { color: tTheme.textSecondary }]}>
                                Date: {order.created_at ? new Date(order.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                            </Text>
                        </View>
                        
                        <TouchableOpacity
                            style={localStyles.statusButton}
                            onPress={() => setStatusMenuVisible(!statusMenuVisible)}
                        >
                            <ModernStatusBadge label={currentStatus.label} variant={currentStatus.variant} />
                            <Ionicons name="chevron-down" size={16} color={tTheme.text} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Status Menu */}
                    {statusMenuVisible && (
                        <View style={[localStyles.statusMenu, { backgroundColor: tTheme.background, ...tTheme.shadow.medium }]}>
                            {statusOptions.map((status) => (
                                <TouchableOpacity
                                    key={status.value}
                                    style={[
                                        localStyles.statusMenuItem,
                                        order.status === status.value && { backgroundColor: tTheme.primarySoft }
                                    ]}
                                    onPress={() => handleStatusChange(status.value)}
                                >
                                    <ModernStatusBadge label={status.label} variant={status.variant} />
                                    {order.status === status.value && (
                                        <Ionicons name="checkmark" size={20} color={tTheme.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Supplier Info Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="business" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Fournisseur</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        <Text style={[localStyles.supplierName, { color: tTheme.text }]}>
                            {supplier?.name || 'N/A'}
                        </Text>
                        {supplier?.address && (
                            <View style={localStyles.infoRow}>
                                <Ionicons name="location-outline" size={16} color={tTheme.textSecondary} />
                                <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                    {supplier.address}
                                </Text>
                            </View>
                        )}
                        {supplier?.matricule_fiscale && (
                            <View style={localStyles.infoRow}>
                                <Ionicons name="card-outline" size={16} color={tTheme.textSecondary} />
                                <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                    MF: {supplier.matricule_fiscale}
                                </Text>
                            </View>
                        )}
                        {supplier?.phone && (
                            <View style={localStyles.infoRow}>
                                <Ionicons name="call-outline" size={16} color={tTheme.textSecondary} />
                                <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                    {supplier.phone}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Items Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="list" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Articles</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        {items.length > 0 ? (
                            items.map((item, index) => {
                                const quantity = parseFloat(item.quantity) || 0;
                                const price = parseFloat(item.purchase_price || item.unit_price) || 0;
                                const subtotal = quantity * price;
                                
                                return (
                                    <View 
                                        key={index} 
                                        style={[
                                            localStyles.itemRow,
                                            { borderBottomColor: tTheme.border },
                                            index === items.length - 1 && localStyles.lastItemRow
                                        ]}
                                    >
                                        <View style={localStyles.itemLeft}>
                                            <Text style={[localStyles.itemName, { color: tTheme.text }]}>
                                                {item.item_name || item.article_name || item.description || 'Article'}
                                            </Text>
                                            <Text style={[localStyles.itemDetails, { color: tTheme.textSecondary }]}>
                                                {formatNumber(quantity)} × {formatNumber(price)} TND
                                            </Text>
                                        </View>
                                        <Text style={[localStyles.itemTotal, { color: tTheme.text }]}>
                                            {formatNumber(subtotal)} TND
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={[localStyles.emptyItems, { color: tTheme.textSecondary }]}>
                                Aucun article
                            </Text>
                        )}
                    </View>
                </View>

                {/* Totals Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="calculator" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Montants</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        <View style={localStyles.totalRow}>
                            <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>Total HT</Text>
                            <Text style={[localStyles.totalValue, { color: tTheme.text }]}>
                                {formatNumber(totalHT)} TND
                            </Text>
                        </View>
                        <View style={localStyles.totalRow}>
                            <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>TVA</Text>
                            <Text style={[localStyles.totalValue, { color: tTheme.text }]}>
                                {formatNumber(totalVAT)} TND
                            </Text>
                        </View>
                        {fiscalStamp > 0 && (
                            <View style={localStyles.totalRow}>
                                <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>Timbre fiscal</Text>
                                <Text style={[localStyles.totalValue, { color: tTheme.text }]}>
                                    {formatNumber(fiscalStamp)} TND
                                </Text>
                            </View>
                        )}
                        <View style={[localStyles.totalRow, localStyles.grandTotalRow, { borderTopColor: tTheme.border }]}>
                            <Text style={[localStyles.grandTotalLabel, { color: tTheme.text }]}>Total TTC</Text>
                            <Text style={[localStyles.grandTotalValue, { color: tTheme.primary }]}>
                                {formatNumber(totalTTC)} TND
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Notes Card */}
                {order.notes && (
                    <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <View style={localStyles.cardHeader}>
                            <Ionicons name="document-text" size={20} color={tTheme.primary} />
                            <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Notes</Text>
                        </View>
                        <View style={localStyles.cardContent}>
                            <Text style={[localStyles.notesText, { color: tTheme.text }]}>
                                {order.notes}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '600',
    },
    headerCard: {
        margin: 16,
        marginBottom: 12,
        padding: 20,
        borderRadius: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    orderLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    orderNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusMenu: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusMenuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    card: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
        gap: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    cardContent: {
        padding: 16,
        paddingTop: 0,
    },
    supplierName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    lastItemRow: {
        borderBottomWidth: 0,
    },
    itemLeft: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 13,
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: '700',
    },
    emptyItems: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 15,
    },
    totalValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    grandTotalRow: {
        borderTopWidth: 2,
        marginTop: 8,
        paddingTop: 16,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    notesText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
