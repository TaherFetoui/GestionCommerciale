import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModernStatusBadge } from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { printInvoiceWeb } from '../../services/pdfGenerator';
import { getGlobalStyles } from '../../styles/GlobalStyles';

// Native-only imports
let RNHTMLtoPDF, RNPrint, Share, generateInvoiceHtml;
if (Platform.OS !== 'web') {
    RNHTMLtoPDF = require('react-native-html-to-pdf').default;
    RNPrint = require('react-native-print').default;
    Share = require('react-native-share').default;
    generateInvoiceHtml = require('../../services/pdfGenerator').generateInvoiceHtml;
}

export default function InvoiceDetailScreen({ route, navigation }) {
    const { invoice_id } = route.params;
    const [invoice, setInvoice] = useState(null);
    const [client, setClient] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [statusMenuVisible, setStatusMenuVisible] = useState(false);

    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const statusOptions = [
        { value: 'awaiting_payment', label: 'En attente', variant: 'warning' },
        { value: 'paid', label: 'Payée', variant: 'success' },
        { value: 'overdue', label: 'En retard', variant: 'error' },
        { value: 'cancelled', label: 'Annulée', variant: 'default' },
    ];

    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            setLoading(true);
            
            // Fetch company info
            const { data: companyData } = await supabase
                .from('company_info')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (companyData) {
                setCompanyInfo(companyData);
            }
            
            // Fetch invoice
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    client:clients(*)
                `)
                .eq('id', invoice_id)
                .single();

            if (error) {
                Alert.alert(t.error, 'Impossible de charger les détails de la facture');
                console.error(error);
            } else {
                setInvoice(data);
                setClient(data.client);
            }
            setLoading(false);
        };

        fetchInvoiceDetails();
    }, [invoice_id, user, t.error]);

    const handleStatusChange = useCallback(async (newStatus) => {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', invoice_id);

            if (error) {
                Alert.alert(t.error, 'Impossible de mettre à jour le statut');
                console.error(error);
            } else {
                setInvoice(prev => ({ ...prev, status: newStatus }));
                setStatusMenuVisible(false);
                Alert.alert('Succès', 'Statut mis à jour avec succès');
            }
        } catch (error) {
            console.error('Status update error:', error);
            Alert.alert(t.error, 'Une erreur est survenue');
        }
    }, [invoice_id, t.error]);

    const handlePrint = useCallback(async () => {
        if (!invoice || !client) {
            Alert.alert(t.error, 'Données de facture manquantes');
            return;
        }

        if (!companyInfo) {
            Alert.alert(t.error, 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société');
            return;
        }

        setPdfLoading(true);
        try {
            if (Platform.OS === 'web') {
                printInvoiceWeb(invoice, client, companyInfo);
            } else {
                const html = generateInvoiceHtml(invoice, client, companyInfo);
                const { filePath } = await RNHTMLtoPDF.convert({
                    html,
                    fileName: `Facture_${invoice.invoice_number}`,
                    directory: 'Documents',
                });
                await RNPrint.print({ filePath });
            }
        } catch (error) {
            console.error('Print error:', error);
            Alert.alert(t.error, 'Impossible d\'imprimer la facture');
        } finally {
            setPdfLoading(false);
        }
    }, [invoice, client, companyInfo, t.error]);

    const handleDownload = useCallback(async () => {
        if (!invoice || !client) {
            Alert.alert(t.error, 'Données de facture manquantes');
            return;
        }

        if (!companyInfo) {
            Alert.alert(t.error, 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société');
            return;
        }

        setPdfLoading(true);
        try {
            if (Platform.OS === 'web') {
                printInvoiceWeb(invoice, client, companyInfo);
            } else {
                const html = generateInvoiceHtml(invoice, client, companyInfo);
                const { filePath } = await RNHTMLtoPDF.convert({
                    html,
                    fileName: `Facture_${invoice.invoice_number}`,
                    directory: 'Documents',
                });
                await Share.open({
                    url: `file://${filePath}`,
                    type: 'application/pdf',
                    title: 'Télécharger la facture'
                });
            }
        } catch (error) {
            if (error.message !== "User did not share") {
                console.error('Download error:', error);
                Alert.alert(t.error, 'Impossible de télécharger la facture');
            }
        } finally {
            setPdfLoading(false);
        }
    }, [invoice, client, companyInfo, t.error]);

    const formatNumber = (num) => parseFloat(num || 0).toFixed(3);

    if (loading) {
        return (
            <View style={[styles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[localStyles.loadingText, { color: tTheme.textSecondary }]}>Chargement...</Text>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={[styles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <Ionicons name="document-text-outline" size={64} color={tTheme.textSecondary} />
                <Text style={[localStyles.emptyText, { color: tTheme.text }]}>Facture introuvable</Text>
            </View>
        );
    }

    const items = invoice.items || [];
    const totalHT = parseFloat(invoice.total_ht) || 0;
    const totalVAT = parseFloat(invoice.total_vat) || 0;
    const fiscalStamp = parseFloat(invoice.fiscal_stamp) || 0;
    const totalTTC = parseFloat(invoice.total_amount) || 0;

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Card */}
                <View style={[localStyles.headerCard, { backgroundColor: tTheme.card, ...tTheme.shadow.medium }]}>
                    <View style={localStyles.headerTop}>
                        <View style={localStyles.headerLeft}>
                            <View style={[localStyles.invoiceIcon, { backgroundColor: tTheme.primary + '15' }]}>
                                <Ionicons name="document-text" size={32} color={tTheme.primary} />
                            </View>
                            <View>
                                <Text style={[localStyles.invoiceLabel, { color: tTheme.textSecondary }]}>Facture N°</Text>
                                <Text style={[localStyles.invoiceNumber, { color: tTheme.primary }]}>
                                    {invoice.invoice_number}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setStatusMenuVisible(!statusMenuVisible)}
                            style={localStyles.statusButton}
                        >
                            <ModernStatusBadge 
                                label={statusOptions.find(s => s.value === invoice.status)?.label || 'En attente'}
                                variant={statusOptions.find(s => s.value === invoice.status)?.variant || 'warning'}
                            />
                            <Ionicons name="chevron-down" size={16} color={tTheme.textSecondary} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Status Change Menu */}
                    {statusMenuVisible && (
                        <View style={[localStyles.statusMenu, { backgroundColor: tTheme.card, borderColor: tTheme.border, ...tTheme.shadow.medium }]}>
                            {statusOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        localStyles.statusMenuItem,
                                        { borderBottomColor: tTheme.divider },
                                        invoice.status === option.value && { backgroundColor: tTheme.primary + '10' }
                                    ]}
                                    onPress={() => handleStatusChange(option.value)}
                                >
                                    <ModernStatusBadge label={option.label} variant={option.variant} />
                                    {invoice.status === option.value && (
                                        <Ionicons name="checkmark" size={20} color={tTheme.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={localStyles.invoiceInfo}>
                        <View style={localStyles.infoRow}>
                            <Text style={[localStyles.infoLabel, { color: tTheme.textSecondary }]}>Date d'émission</Text>
                            <Text style={[localStyles.infoValue, { color: tTheme.text }]}>
                                {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                        <View style={localStyles.infoRow}>
                            <Text style={[localStyles.infoLabel, { color: tTheme.textSecondary }]}>Date d'échéance</Text>
                            <Text style={[localStyles.infoValue, { color: tTheme.text }]}>
                                {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                            </Text>
                        </View>
                        <View style={localStyles.infoRow}>
                            <Text style={[localStyles.infoLabel, { color: tTheme.textSecondary }]}>Mode de paiement</Text>
                            <Text style={[localStyles.infoValue, { color: tTheme.text }]}>
                                {invoice.payment_method || 'Non spécifié'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Client Card */}
                <View style={[localStyles.clientCard, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="person-outline" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Client</Text>
                    </View>
                    <Text style={[localStyles.clientName, { color: tTheme.text }]}>{client?.name || 'N/A'}</Text>
                    {client?.address && (
                        <Text style={[localStyles.clientDetail, { color: tTheme.textSecondary }]}>
                            <Ionicons name="location-outline" size={14} /> {client.address}
                        </Text>
                    )}
                    {(client?.tax_id || client?.mf) && (
                        <Text style={[localStyles.clientDetail, { color: tTheme.textSecondary }]}>
                            <Ionicons name="card-outline" size={14} /> M.F: {client.tax_id || client.mf}
                        </Text>
                    )}
                </View>

                {/* Items Card */}
                <View style={[localStyles.itemsCard, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="list-outline" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Articles</Text>
                    </View>

                    {items.map((item, index) => {
                        const qty = parseFloat(item.quantity) || 0;
                        const unitPrice = parseFloat(item.unitPrice) || 0;
                        const vatRate = parseFloat(item.vatRate) || 0;
                        const lineHT = qty * unitPrice;
                        const lineTTC = lineHT * (1 + vatRate / 100);

                        return (
                            <View
                                key={index}
                                style={[
                                    localStyles.itemRow,
                                    { borderBottomColor: tTheme.divider },
                                    index === items.length - 1 && { borderBottomWidth: 0 }
                                ]}
                            >
                                <View style={localStyles.itemLeft}>
                                    <Text style={[localStyles.itemName, { color: tTheme.text }]}>
                                        {item.description || 'Article'}
                                    </Text>
                                    {item.ref && (
                                        <Text style={[localStyles.itemRef, { color: tTheme.textSecondary }]}>
                                            Réf: {item.ref}
                                        </Text>
                                    )}
                                    <Text style={[localStyles.itemDetail, { color: tTheme.textSecondary }]}>
                                        {qty} × {formatNumber(unitPrice)} TND (TVA {vatRate}%)
                                    </Text>
                                </View>
                                <Text style={[localStyles.itemTotal, { color: tTheme.primary }]}>
                                    {formatNumber(lineTTC)} TND
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Totals Card */}
                <View style={[localStyles.totalsCard, { backgroundColor: tTheme.card, ...tTheme.shadow.medium }]}>
                    <View style={localStyles.totalRow}>
                        <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>Total HT</Text>
                        <Text style={[localStyles.totalValue, { color: tTheme.text }]}>{formatNumber(totalHT)} TND</Text>
                    </View>
                    <View style={localStyles.totalRow}>
                        <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>Total TVA</Text>
                        <Text style={[localStyles.totalValue, { color: tTheme.text }]}>{formatNumber(totalVAT)} TND</Text>
                    </View>
                    <View style={localStyles.totalRow}>
                        <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>Timbre Fiscal</Text>
                        <Text style={[localStyles.totalValue, { color: tTheme.text }]}>{formatNumber(fiscalStamp)} TND</Text>
                    </View>
                    <View style={[localStyles.totalRow, localStyles.totalRowFinal, { borderTopColor: tTheme.border }]}>
                        <Text style={[localStyles.totalLabelFinal, { color: tTheme.text }]}>Total TTC</Text>
                        <Text style={[localStyles.totalValueFinal, { color: tTheme.primary }]}>{formatNumber(totalTTC)} TND</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.warning }]}
                        onPress={() => navigation.navigate('CreateInvoice', { 
                            invoiceToEdit: invoice,
                            clientData: client 
                        })}
                    >
                        <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                        <Text style={localStyles.actionButtonText}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[localStyles.actionButton, { backgroundColor: tTheme.primary }]}
                        onPress={handlePrint}
                        disabled={pdfLoading}
                    >
                        {pdfLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="print" size={20} color="#FFFFFF" />
                                <Text style={localStyles.actionButtonText}>Imprimer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        marginTop: 8,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    headerCard: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    invoiceIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    invoiceLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    invoiceNumber: {
        fontSize: 20,
        fontWeight: '700',
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusMenu: {
        position: 'absolute',
        top: 65,
        right: 20,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        minWidth: 160,
        zIndex: 1000,
    },
    statusMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
    },
    invoiceInfo: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    clientCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    clientName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    clientDetail: {
        fontSize: 13,
        marginBottom: 4,
        lineHeight: 20,
    },
    itemsCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    itemLeft: {
        flex: 1,
        marginRight: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemRef: {
        fontSize: 11,
        marginBottom: 4,
    },
    itemDetail: {
        fontSize: 12,
    },
    itemTotal: {
        fontSize: 14,
        fontWeight: '700',
    },
    totalsCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    totalLabel: {
        fontSize: 14,
    },
    totalValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    totalRowFinal: {
        borderTopWidth: 2,
        paddingTop: 16,
        marginTop: 8,
    },
    totalLabelFinal: {
        fontSize: 16,
        fontWeight: '700',
    },
    totalValueFinal: {
        fontSize: 18,
        fontWeight: '700',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginBottom: 24,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});