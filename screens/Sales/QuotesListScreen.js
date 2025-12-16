import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable,
} from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

// Native-only imports
let RNHTMLtoPDF, RNPrint, Share;
if (Platform.OS !== 'web') {
    RNHTMLtoPDF = require('react-native-html-to-pdf').default;
    RNPrint = require('react-native-print').default;
    Share = require('react-native-share').default;
}

export default function QuotesListScreen() {
    const navigation = useNavigation();
    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const { theme, language, user } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const styles = getGlobalStyles(theme);

    const fetchQuotes = useCallback(async () => {
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
        
        const { data, error } = await supabase.from('quotes').select('*, clients (name, address, matricule_fiscale)').order('created_at', { ascending: false });
        if (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
        } else {
            setQuotes(data || []);
            setFilteredQuotes(data || []);
        }
        setLoading(false);
    }, [t.error, user]);

    useFocusEffect(
        useCallback(() => {
            fetchQuotes();
        }, [fetchQuotes])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
                    onPress={() => navigation.navigate('CreateQuote')}
                >
                    <Ionicons name="add" size={20} color={tTheme.primary} />
                    <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau devis</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, theme]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchQuotes();
        setRefreshing(false);
    }, [fetchQuotes]);

    // Filter quotes based on search and status
    React.useEffect(() => {
        let result = quotes;

        if (searchQuery) {
            result = result.filter(
                (quote) =>
                    quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    quote.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter((quote) => quote.status === statusFilter);
        }

        setFilteredQuotes(result);
    }, [searchQuery, statusFilter, quotes]);

    const confirmDeleteQuote = useCallback(async () => {
        if (!quoteToDelete) return;
        
        setDeleteModalVisible(false);
        
        try {
            const { error } = await supabase
                .from('quotes')
                .delete()
                .eq('id', quoteToDelete.id);

            if (error) {
                setToast({ visible: true, message: error.message, type: 'error' });
            } else {
                setQuotes(prev => prev.filter(quote => quote.id !== quoteToDelete.id));
                setToast({ visible: true, message: 'Devis supprimé avec succès', type: 'success' });
            }
        } catch (error) {
            setToast({ visible: true, message: 'Impossible de supprimer le devis', type: 'error' });
        }
        
        setQuoteToDelete(null);
    }, [quoteToDelete, t.error]);

    const cancelDelete = useCallback(() => {
        setDeleteModalVisible(false);
        setQuoteToDelete(null);
    }, []);

    // Generate quote HTML (matching invoice style)
    const generateQuoteHtml = (quote, client, companyInfo) => {
        const formatNumber = (num) => (num ? parseFloat(num).toFixed(3) : '0.000');
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        };

        const company = {
            name: companyInfo.name || 'N/A',
            address: companyInfo.address || 'N/A',
            city: companyInfo.city || '',
            postalCode: companyInfo.postal_code || '',
            phone: companyInfo.phone || '',
            email: companyInfo.email || '',
            website: companyInfo.website || companyInfo.email || '',
            taxId: companyInfo.tax_id || '',
            rib: companyInfo.rib || '',
            tradeRegister: companyInfo.trade_register || ''
        };

        const items = quote.items || [];
        let totalHT = 0;
        let totalTVA = 0;
        const vatGroups = {};

        items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const vatRate = parseFloat(item.vatRate) || parseFloat(item.vat) || 0;
            const lineHT = qty * unitPrice;
            const lineTVA = lineHT * (vatRate / 100);

            totalHT += lineHT;
            totalTVA += lineTVA;

            if (!vatGroups[vatRate]) {
                vatGroups[vatRate] = { base: 0, amount: 0 };
            }
            vatGroups[vatRate].base += lineHT;
            vatGroups[vatRate].amount += lineTVA;
        });

        const fiscalStamp = parseFloat(quote.fiscal_stamp) || 1.000;
        const totalTTC = totalHT + totalTVA + fiscalStamp;

        const itemRows = items.map((item, index) => {
            const qty = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const vatRate = parseFloat(item.vatRate) || parseFloat(item.vat) || 0;
            const lineHT = qty * unitPrice;
            const lineTTC = lineHT * (1 + vatRate / 100);

            return `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="text-left">${item.ref || '-'}</td>
                    <td class="text-left">${item.description || item.item_name || ''}</td>
                    <td class="text-center">${qty}</td>
                    <td class="text-right">${formatNumber(unitPrice)}</td>
                    <td class="text-right">${formatNumber(lineHT)}</td>
                    <td class="text-center">${vatRate}%</td>
                    <td class="text-right font-bold">${formatNumber(lineTTC)}</td>
                </tr>
            `;
        }).join('');

        const vatSummaryRows = Object.entries(vatGroups).map(([rate, totals]) => `
            <tr>
                <td class="text-center">${rate}%</td>
                <td class="text-right">${formatNumber(totals.base)}</td>
                <td class="text-right font-bold">${formatNumber(totals.amount)}</td>
            </tr>
        `).join('');

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis ${quote.quote_number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; background: white; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 4px solid #000;
            margin-bottom: 15px;
        }
        .company-info { flex: 1; max-width: 55%; }
        .company-logo {
            width: 120px;
            height: 80px;
            background: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            border: 2px solid #E5E7EB;
            overflow: hidden;
        }
        .company-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 8px;
        }
        .company-logo-text { color: #4F46E5; font-size: 36px; font-weight: bold; letter-spacing: 2px; }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .company-details { font-size: 9px; color: #333; line-height: 1.8; }
        .invoice-title {
            text-align: right;
            flex: 1;
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #000;
        }
        .invoice-type {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 0px;
            text-transform: uppercase;
        }
        .invoice-info-box {
            border: 2px solid #000;
            border-radius: 0px;
            padding: 0;
            margin-bottom: 15px;
            background: white;
        }
        .invoice-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .info-item {
            display: flex;
            flex-direction: column;
            padding: 10px 12px;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
        }
        .info-item:nth-child(3n) { border-right: none; }
        .info-item:nth-last-child(-n+3) { border-bottom: none; }
        .info-label {
            font-size: 8px;
            color: #000;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .info-value { font-size: 11px; font-weight: 600; color: #000; }
        .client-section {
            background: white;
            border: 2px solid #000;
            padding: 12px 15px;
            margin-bottom: 15px;
            border-radius: 0px;
        }
        .client-label {
            font-size: 10px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .client-name { font-size: 13px; font-weight: bold; color: #000; margin-bottom: 6px; }
        .client-details { font-size: 9px; color: #000; line-height: 1.8; }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border: 2px solid #000;
        }
        .items-table thead { background: white; color: #000; border-bottom: 2px solid #000; }
        .items-table th {
            padding: 10px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-right: 1px solid #000;
        }
        .items-table th:last-child { border-right: none; }
        .items-table tbody tr { border-bottom: 1px solid #000; }
        .items-table tbody tr:last-child { border-bottom: 2px solid #000; }
        .items-table tbody tr:nth-child(even) { background-color: #F9FAFB; }
        .items-table td {
            padding: 8px 6px;
            font-size: 9px;
            color: #000;
            border-right: 1px solid #D1D5DB;
        }
        .items-table td:last-child { border-right: none; }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 600; }
        .summary-section { display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; }
        .vat-summary, .totals-summary { flex: 1; }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
        }
        .summary-table thead { background: white; border-bottom: 2px solid #000; }
        .summary-table th {
            padding: 8px 6px;
            text-align: left;
            font-size: 8px;
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
            border-right: 1px solid #000;
        }
        .summary-table th:last-child { border-right: none; }
        .summary-table td {
            padding: 6px;
            font-size: 9px;
            border-bottom: 1px solid #D1D5DB;
            border-right: 1px solid #D1D5DB;
        }
        .summary-table td:last-child { border-right: none; }
        .summary-table tfoot td {
            background: #F3F4F6;
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: none;
        }
        .totals-box { background: white; border: 2px solid #000; border-radius: 0px; overflow: hidden; }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border-bottom: 1px solid #D1D5DB;
        }
        .total-row:last-child {
            background: #000;
            color: white;
            border-bottom: none;
            font-size: 13px;
            font-weight: bold;
            padding: 12px;
        }
        .total-label { font-size: 10px; color: #000; font-weight: 600; }
        .total-value { font-size: 10px; font-weight: bold; color: #000; }
        .total-row:last-child .total-label,
        .total-row:last-child .total-value {
            color: white;
            font-size: 13px;
        }
        .footer { margin-top: 20px; padding-top: 15px; border-top: 3px solid #000; }
        .footer-note {
            background: white;
            border: 2px solid #000;
            padding: 10px 12px;
            margin-bottom: 20px;
            border-radius: 0px;
            font-size: 9px;
            color: #000;
            font-weight: 600;
        }
        .company-footer {
            text-align: center;
            font-size: 8px;
            color: #000;
            line-height: 1.8;
            padding: 8px;
            border: 1px solid #000;
            background: #F9FAFB;
        }
        .signature-section { margin-top: 30px; margin-bottom: 15px; text-align: right; }
        .signature-label {
            font-size: 10px;
            color: #000;
            font-weight: bold;
            margin-bottom: 50px;
            text-transform: uppercase;
        }
        .signature-line {
            border-top: 2px solid #000;
            width: 200px;
            margin-left: auto;
            padding-top: 5px;
            font-size: 8px;
            color: #666;
            text-align: center;
        }
        @media print {
            .page { margin: 0; box-shadow: none; }
            body { background: white; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="company-info">
                <div class="company-logo">
                    ${companyInfo.logo_url ? 
                        `<img src="${companyInfo.logo_url}" alt="${company.name}" />` : 
                        `<div class="company-logo-text">${company.name.substring(0, 2).toUpperCase()}</div>`
                    }
                </div>
                <div class="company-name">${company.name}</div>
                <div class="company-details">
                    ${company.address}${company.city ? ', ' + company.city : ''}<br>
                    ${company.postalCode ? company.postalCode + '<br>' : ''}
                    ${company.phone ? 'TEL: ' + company.phone : ''}${company.phone ? '<br>' : ''}
                    ${company.website ? 'Site Web: ' + company.website : ''}${company.website ? '<br>' : ''}
                    ${company.email ? 'Email: ' + company.email : ''}
                </div>
            </div>
            <div class="invoice-title">
                <div class="invoice-type">Devis</div>
            </div>
        </div>

        <div class="invoice-info-box">
            <div class="invoice-info-grid">
                <div class="info-item">
                    <div class="info-label">Numéro</div>
                    <div class="info-value">${quote.quote_number || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${formatDate(quote.issue_date)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Code Client</div>
                    <div class="info-value">${(client.id || '').substring(0, 8).toUpperCase()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date d'expiration</div>
                    <div class="info-value">${formatDate(quote.expiry_date)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Statut</div>
                    <div class="info-value">${quote.status === 'draft' ? 'Brouillon' : quote.status === 'sent' ? 'Envoyé' : quote.status === 'accepted' ? 'Accepté' : 'Refusé'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">M.F</div>
                    <div class="info-value">${company.taxId || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="client-section">
            <div class="client-label">Client:</div>
            <div class="client-name">${client.name || 'N/A'}</div>
            <div class="client-details">
                <strong>Adresse:</strong> ${client.address || 'N/A'}<br>
                <strong>M.F:</strong> ${client.matricule_fiscale || 'N/A'}
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th class="text-center" style="width: 5%;">Ord.</th>
                    <th class="text-left" style="width: 12%;">Réf. Produit</th>
                    <th class="text-left" style="width: 33%;">Libellé</th>
                    <th class="text-center" style="width: 8%;">Qté</th>
                    <th class="text-right" style="width: 12%;">P.Unit.HT</th>
                    <th class="text-right" style="width: 12%;">Net H.T</th>
                    <th class="text-center" style="width: 8%;">TVA%</th>
                    <th class="text-right" style="width: 13%;">Net TTC</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows || '<tr><td colspan="8" class="text-center">Aucun article</td></tr>'}
            </tbody>
        </table>

        <div class="summary-section">
            <div class="vat-summary">
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th class="text-center">TVA</th>
                            <th class="text-right">Base TVA</th>
                            <th class="text-right">Montant TVA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vatSummaryRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="text-center">Total</td>
                            <td class="text-right">${formatNumber(totalHT)}</td>
                            <td class="text-right">${formatNumber(totalTVA)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="totals-summary">
                <div class="totals-box">
                    <div class="total-row">
                        <span class="total-label">Total HT Net</span>
                        <span class="total-value">${formatNumber(totalHT)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Total TVA</span>
                        <span class="total-value">${formatNumber(totalTVA)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Timbre Fiscal</span>
                        <span class="total-value">${formatNumber(fiscalStamp)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Total TTC</span>
                        <span class="total-value">${formatNumber(totalTTC)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-note">
                Ce devis est valable jusqu'au ${formatDate(quote.expiry_date)}
            </div>

            <div class="signature-section">
                <div class="signature-label">Cachet et Signature</div>
                <div class="signature-line">Signature autorisée</div>
            </div>

            <div class="company-footer">
                ${company.address ? 'Siège: ' + company.address + (company.city ? ', ' + company.city : '') : ''}${company.address ? '<br>' : ''}
                ${company.phone ? 'Tél: ' + company.phone : ''}${company.website ? ' - Site Web: ' + company.website : ''}${company.email ? ' - Email: ' + company.email : ''}${(company.phone || company.website || company.email) ? '<br>' : ''}
                ${company.rib ? 'RIB: ' + company.rib : ''}
            </div>
        </div>
    </div>
</body>
</html>
        `;
    };

    const handlePrintQuote = useCallback(async (quote) => {
        if (!quote.clients) {
            setToast({ visible: true, message: 'Informations client manquantes', type: 'warning' });
            return;
        }

        if (!companyInfo) {
            setToast({ visible: true, message: 'Veuillez compléter les informations de votre entreprise dans Paramétrage Société', type: 'warning' });
            return;
        }

        if (Platform.OS === 'web') {
            // Web: Use browser print dialog
            const html = generateQuoteHtml(quote, quote.clients, companyInfo);
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
        } else {
            // Mobile: Generate PDF and print
            try {
                const html = generateQuoteHtml(quote, quote.clients, companyInfo);
                const { filePath } = await RNHTMLtoPDF.convert({
                    html,
                    fileName: `Devis_${quote.quote_number}`,
                    directory: 'Documents',
                });
                await RNPrint.print({ filePath });
            } catch (error) {
                console.error('Print error:', error);
                setToast({ visible: true, message: 'Impossible d\'imprimer le devis', type: 'error' });
            }
        }
    }, [companyInfo]);

    const tableColumns = [
        {
            key: 'quote_number',
            label: 'N° Devis',
            flex: 1.2,
            render: (row) => (
                <View>
                    <Text style={[localStyles.quoteNumber, { color: tTheme.primary }]} numberOfLines={1}>
                        {row.quote_number}
                    </Text>
                    <Text style={[localStyles.quoteDate, { color: tTheme.textSecondary }]}>
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
                    {row.clients?.name || 'N/A'}
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
                    'draft': { label: 'Brouillon', variant: 'default' },
                    'sent': { label: 'Envoyé', variant: 'info' },
                    'accepted': { label: 'Accepté', variant: 'success' },
                    'rejected': { label: 'Refusé', variant: 'error' },
                };
                const config = statusConfig[row.status] || { label: 'Brouillon', variant: 'default' };
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
                            handlePrintQuote(row);
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
                            setQuoteToDelete(row);
                            setDeleteModalVisible(true);
                        }}
                    >
                        <Ionicons name="trash" size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    const filterOptions = [
        { value: 'all', label: 'Tous' },
        { value: 'draft', label: 'Brouillon' },
        { value: 'sent', label: 'Envoyé' },
        { value: 'accepted', label: 'Accepté' },
        { value: 'rejected', label: 'Refusé' },
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
                        placeholder="Rechercher un devis..."
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

                <View style={localStyles.tableWrapper}>
                    <ModernTable
                        data={filteredQuotes}
                        columns={tableColumns}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucun devis trouvé. Créez votre premier devis."
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
                            Supprimer le devis
                        </Text>
                        <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
                            Voulez-vous vraiment supprimer le devis{'\n'}
                            <Text style={{ fontWeight: 'bold', color: tTheme.primary }}>
                                {quoteToDelete?.quote_number}
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
                                onPress={confirmDeleteQuote}
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
    quoteNumber: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    quoteDate: {
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
});