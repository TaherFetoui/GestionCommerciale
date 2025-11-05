import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import {
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable
} from '../../components/ModernUIComponents';
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

export default function InvoicesListScreen({ navigation }) {
    const [invoices, setInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [companyInfo, setCompanyInfo] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    
    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const fetchInvoices = useCallback(async () => {
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
        
        // Fetch invoices
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                client:clients(id, name, address, matricule_fiscale)
            `)
            .order('issue_date', { ascending: false });
        
        if (error) {
            console.error('Error fetching invoices:', error);
            Alert.alert('Erreur', error.message || 'Impossible de charger les factures');
        } else {
            setInvoices(data || []);
            setFilteredInvoices(data || []);
        }
        setLoading(false);
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
        }, [fetchInvoices])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateInvoice')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouvelle facture</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchInvoices();
        setRefreshing(false);
    }, [fetchInvoices]);

    // Filter invoices based on search and status
    React.useEffect(() => {
        let result = invoices;

        // Filter by search query
        if (searchQuery) {
            result = result.filter(inv =>
                inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(inv => inv.status === statusFilter);
        }

        setFilteredInvoices(result);
    }, [searchQuery, statusFilter, invoices]);

    // Handle print invoice
    const handlePrintInvoice = useCallback(async (invoice) => {
        if (!invoice.client) {
            Alert.alert('Erreur', 'Informations client manquantes');
            return;
        }

        if (!companyInfo) {
            Alert.alert('Erreur', 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société');
            return;
        }

        if (Platform.OS === 'web') {
            // Web: Use browser print dialog
            printInvoiceWeb(invoice, invoice.client, companyInfo);
        } else {
            // Mobile: Generate PDF and print
            try {
                const html = generateInvoiceHtml(invoice, invoice.client, companyInfo);
                const { filePath } = await RNHTMLtoPDF.convert({
                    html,
                    fileName: `Facture_${invoice.invoice_number}`,
                    directory: 'Documents',
                });
                await RNPrint.print({ filePath });
            } catch (error) {
                console.error('Print error:', error);
                Alert.alert('Erreur', 'Impossible d\'imprimer la facture');
            }
        }
    }, [companyInfo]);

    // Handle download/share invoice
    const handleDownloadInvoice = useCallback(async (invoice) => {
        if (!invoice.client) {
            Alert.alert('Erreur', 'Informations client manquantes');
            return;
        }

        if (!companyInfo) {
            Alert.alert('Erreur', 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société');
            return;
        }

        if (Platform.OS === 'web') {
            // Web: Open print dialog (user can save as PDF)
            printInvoiceWeb(invoice, invoice.client, companyInfo);
        } else {
            // Mobile: Generate PDF and share
            try {
                const html = generateInvoiceHtml(invoice, invoice.client, companyInfo);
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
            } catch (error) {
                if (error.message !== "User did not share") {
                    console.error('Download error:', error);
                    Alert.alert('Erreur', 'Impossible de télécharger la facture');
                }
            }
        }
    }, [companyInfo]);

    // Handle delete invoice
    const handleDeleteInvoice = useCallback((invoice) => {
        console.log('Delete button clicked for invoice:', invoice.invoice_number);
        setInvoiceToDelete(invoice);
        setDeleteModalVisible(true);
    }, []);

    // Confirm delete
    const confirmDelete = useCallback(async () => {
        if (!invoiceToDelete) return;
        
        console.log('Deleting invoice:', invoiceToDelete.id);
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', invoiceToDelete.id)
                .eq('user_id', user.id);

            if (error) {
                console.error('Delete error:', error);
                Alert.alert('Erreur', error.message);
            } else {
                console.log('Invoice deleted successfully');
                setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id));
                Alert.alert('✓ Succès', 'Facture supprimée avec succès');
            }
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Erreur', 'Impossible de supprimer la facture');
        }
        
        setInvoiceToDelete(null);
    }, [invoiceToDelete, user, setInvoices]);

    // Cancel delete
    const cancelDelete = useCallback(() => {
        console.log('Delete cancelled');
        setDeleteModalVisible(false);
        setInvoiceToDelete(null);
    }, []);

    const tableColumns = useMemo(() => {
        // Always show all columns for both mobile and desktop
        return [
            {
                key: 'invoice_number',
                label: 'N° Facture',
                flex: 1.2,
                render: (row) => (
                    <View>
                        <Text style={[localStyles.invoiceNumber, { color: tTheme.primary }]} numberOfLines={1}>
                            {row.invoice_number}
                        </Text>
                        <Text style={[localStyles.invoiceDate, { color: tTheme.textSecondary }]}>
                            {new Date(row.issue_date).toLocaleDateString('fr-FR')}
                        </Text>
                    </View>
                ),
            },
            {
                key: 'client',
                label: 'Client',
                flex: 1.5,
                render: (row) => (
                    <Text style={{ color: tTheme.text, fontWeight: '500' }} numberOfLines={1}>
                        {row.client?.name || 'N/A'}
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
                        'awaiting_payment': { label: 'En attente', variant: 'warning' },
                        'paid': { label: 'Payée', variant: 'success' },
                        'overdue': { label: 'En retard', variant: 'error' },
                        'cancelled': { label: 'Annulée', variant: 'default' },
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
                                handlePrintInvoice(row);
                            }}
                        >
                            <Ionicons name="print-outline" size={18} color={tTheme.primary} />
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
                                handleDeleteInvoice(row);
                            }}
                        >
                            <Ionicons name="trash" size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ),
            },
        ];
    }, [tTheme, handlePrintInvoice, handleDeleteInvoice]);

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'paid', label: 'Payé' },
        { value: 'awaiting_payment', label: 'En attente' },
        { value: 'overdue', label: 'En retard' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                {/* Search and Filters */}
                <View style={localStyles.filtersContainer}>
                    <ModernSearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Rechercher une facture..."
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

                {/* Modern Table */}
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true}
                    style={localStyles.tableWrapper}
                    contentContainerStyle={{ minWidth: '100%' }}
                >
                    <View style={{ flex: 1, minWidth: isMobile ? 600 : '100%' }}>
                        <ModernTable
                            data={filteredInvoices}
                            columns={tableColumns}
                            onRowPress={(invoice) => navigation.navigate('InvoiceDetail', { invoice_id: invoice.id })}
                            theme={theme}
                            loading={loading}
                            emptyMessage="Aucune facture trouvée. Créez votre première facture."
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
                            Supprimer la facture
                        </Text>

                        {/* Message */}
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Voulez-vous vraiment supprimer la facture{'\n'}
                            <Text style={{ fontWeight: 'bold', color: tTheme.primary }}>
                                {invoiceToDelete?.invoice_number}
                            </Text>
                            {'\n\n'}
                            <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                                Cette action est irréversible.
                            </Text>
                        </Text>

                        {/* Buttons */}
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
                                onPress={confirmDelete}
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
    invoiceNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    invoiceDate: {
        fontSize: 12,
    },
    clientName: {
        fontSize: 12,
        fontWeight: '500',
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
    // Modal styles
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
    modalTitle: {
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
});