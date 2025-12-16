import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModernStatusBadge } from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function QuoteDetailsScreen({ route, navigation }) {
    const { quote_id } = route.params;
    const [quote, setQuote] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusMenuVisible, setStatusMenuVisible] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const statusOptions = [
        { value: 'draft', label: 'Brouillon', variant: 'default' },
        { value: 'sent', label: 'Envoyé', variant: 'info' },
        { value: 'accepted', label: 'Accepté', variant: 'success' },
        { value: 'rejected', label: 'Rejeté', variant: 'warning' },
    ];

    useEffect(() => {
        const fetchQuoteDetails = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', quote_id)
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching quote:', error);
                setToast({ visible: true, message: 'Impossible de charger les détails du devis', type: 'error' });
            } else if (data) {
                if (data.client_id) {
                    const { data: clientData, error: clientError } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', data.client_id)
                        .single();
                    
                    if (!clientError && clientData) {
                        setClient(clientData);
                    }
                }
                setQuote(data);
            }
            setLoading(false);
        };

        fetchQuoteDetails();
    }, [quote_id, user]);

    const handleStatusChange = useCallback(async (newStatus) => {
        try {
            const { error } = await supabase
                .from('quotes')
                .update({ status: newStatus })
                .eq('id', quote_id);

            if (error) {
                setToast({ visible: true, message: 'Impossible de mettre à jour le statut', type: 'error' });
                console.error(error);
            } else {
                setQuote(prev => ({ ...prev, status: newStatus }));
                setStatusMenuVisible(false);
                setToast({ visible: true, message: 'Statut mis à jour avec succès', type: 'success' });
            }
        } catch (error) {
            console.error('Status update error:', error);
            setToast({ visible: true, message: 'Une erreur est survenue', type: 'error' });
        }
    }, [quote_id]);

    const formatNumber = (num) => parseFloat(num || 0).toFixed(3);

    if (loading) {
        return (
            <View style={[styles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[localStyles.loadingText, { color: tTheme.textSecondary }]}>Chargement...</Text>
            </View>
        );
    }

    if (!quote) {
        return (
            <View style={[styles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <Ionicons name="document-text-outline" size={64} color={tTheme.textSecondary} />
                <Text style={[localStyles.emptyText, { color: tTheme.text }]}>Devis introuvable</Text>
            </View>
        );
    }

    const items = quote.items || [];
    const totalHT = items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        return sum + (quantity * price);
    }, 0);
    const totalVAT = totalHT * 0.19;
    const totalTTC = totalHT + totalVAT;

    const currentStatus = statusOptions.find(s => s.value === quote.status) || statusOptions[0];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Card */}
                <View style={[localStyles.headerCard, { backgroundColor: tTheme.card, ...tTheme.shadow.medium }]}>
                    <View style={localStyles.headerTop}>
                        <View style={localStyles.headerLeft}>
                            <Text style={[localStyles.quoteLabel, { color: tTheme.textSecondary }]}>Devis</Text>
                            <Text style={[localStyles.quoteNumber, { color: tTheme.primary }]}>
                                {quote.quote_number}
                            </Text>
                            <Text style={[localStyles.quoteDate, { color: tTheme.textSecondary }]}>
                                Date: {quote.created_at ? new Date(quote.created_at).toLocaleDateString('fr-FR') : 'N/A'}
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

                    {statusMenuVisible && (
                        <View style={[localStyles.statusMenu, { backgroundColor: tTheme.background, ...tTheme.shadow.medium }]}>
                            {statusOptions.map((status) => (
                                <TouchableOpacity
                                    key={status.value}
                                    style={[
                                        localStyles.statusMenuItem,
                                        quote.status === status.value && { backgroundColor: tTheme.primarySoft }
                                    ]}
                                    onPress={() => handleStatusChange(status.value)}
                                >
                                    <ModernStatusBadge label={status.label} variant={status.variant} />
                                    {quote.status === status.value && (
                                        <Ionicons name="checkmark" size={20} color={tTheme.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Client Info Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="person" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Client</Text>
                    </View>
                    <View style={localStyles.cardContent}>
                        <Text style={[localStyles.clientName, { color: tTheme.text }]}>
                            {client?.name || 'N/A'}
                        </Text>
                        {client?.address && (
                            <View style={localStyles.infoRow}>
                                <Ionicons name="location-outline" size={16} color={tTheme.textSecondary} />
                                <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                    {client.address}
                                </Text>
                            </View>
                        )}
                        {client?.matricule_fiscale && (
                            <View style={localStyles.infoRow}>
                                <Ionicons name="card-outline" size={16} color={tTheme.textSecondary} />
                                <Text style={[localStyles.infoText, { color: tTheme.textSecondary }]}>
                                    MF: {client.matricule_fiscale}
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
                                const price = parseFloat(item.unitPrice) || 0;
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
                                                {item.description || 'Article'}
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
                            <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>TVA (19%)</Text>
                            <Text style={[localStyles.totalValue, { color: tTheme.text }]}>
                                {formatNumber(totalVAT)} TND
                            </Text>
                        </View>
                        <View style={[localStyles.totalRow, localStyles.grandTotalRow, { borderTopColor: tTheme.border }]}>
                            <Text style={[localStyles.grandTotalLabel, { color: tTheme.text }]}>Total TTC</Text>
                            <Text style={[localStyles.grandTotalValue, { color: tTheme.primary }]}>
                                {formatNumber(totalTTC)} TND
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Notes Card */}
                {quote.notes && (
                    <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                        <View style={localStyles.cardHeader}>
                            <Ionicons name="document-text" size={20} color={tTheme.primary} />
                            <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Notes</Text>
                        </View>
                        <View style={localStyles.cardContent}>
                            <Text style={[localStyles.notesText, { color: tTheme.text }]}>
                                {quote.notes}
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
    quoteLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    quoteNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    quoteDate: {
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
    clientName: {
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
