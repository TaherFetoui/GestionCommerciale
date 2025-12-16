import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions
} from 'react-native';
import {
    ModernStatusBadge,
    ModernTable
} from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { useReporting } from '../../context/ReportingContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ClientReportScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { clientId, clientName } = route.params;
    const { theme, language } = useAuth();
    const { selectedClient } = useReporting();
    
    console.log('=== ClientReportScreen mounted ===');
    console.log('clientId:', clientId);
    console.log('clientName:', clientName);
    console.log('route.params:', route.params);
    
    const [client, setClient] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        transactionCount: 0
    });

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    useEffect(() => {
        console.log('useEffect triggered with clientId:', clientId);
        if (clientId) {
            loadClientData();
        }
    }, [clientId]);

    const loadClientData = async () => {
        console.log('loadClientData started');
        setLoading(true);
        const clientData = await fetchClientDetails();
        if (clientData) {
            await fetchTransactions(clientData);
        }
        setLoading(false);
    };

    const fetchClientDetails = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();

        if (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
            return null;
        } else {
            setClient(data);
            return data;
        }
    };

    const fetchTransactions = async (clientData) => {
        try {
            // Utiliser les données du client passées en paramètre
            const clientNameValue = clientData?.name || route.params?.clientName || '';

            // Récupérer les factures
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (invoicesError) throw invoicesError;

            // Récupérer les devis
            const { data: quotes, error: quotesError } = await supabase
                .from('quotes')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (quotesError) throw quotesError;

            // Récupérer les retenues à la source clients
            const { data: returns, error: returnsError } = await supabase
                .from('client_returns')
                .select('*')
                .eq('client', clientNameValue)
                .order('retention_date', { ascending: false });

            if (returnsError) console.log('Erreur retenues:', returnsError);

            // Récupérer les ordres de paiement clients
            const { data: payments, error: paymentsError } = await supabase
                .from('client_payment_orders')
                .select('*')
                .eq('client', clientNameValue)
                .order('payment_date', { ascending: false });

            if (paymentsError) console.log('Erreur paiements:', paymentsError);

            // Récupérer les chèques reçus du client
            const { data: checks, error: checksError } = await supabase
                .from('checks')
                .select('*')
                .eq('check_type', 'received')
                .eq('client_supplier', clientNameValue)
                .order('issue_date', { ascending: false });

            if (checksError) console.log('Erreur chèques:', checksError);

            // Combiner et formater TOUTES les transactions
            const allTransactions = [
                // Factures (montants à recevoir)
                ...(invoices || []).map(inv => ({
                    id: `invoice-${inv.id}`,
                    date: inv.created_at,
                    type: 'Facture',
                    reference: inv.invoice_number,
                    amount: parseFloat(inv.total_amount || 0),
                    isDebit: true, // Client doit payer
                    status: inv.status || 'draft',
                    description: inv.notes || 'Facture de vente'
                })),
                // Devis
                ...(quotes || []).map(quote => ({
                    id: `quote-${quote.id}`,
                    date: quote.created_at,
                    type: 'Devis',
                    reference: quote.quote_number,
                    amount: parseFloat(quote.total_amount || 0),
                    isDebit: false, // Pas encore confirmé
                    status: quote.status || 'draft',
                    description: quote.notes || 'Devis de vente'
                })),
                // Retenues à la source (montants retenus)
                ...(returns || []).map(ret => ({
                    id: `return-${ret.id}`,
                    date: ret.retention_date,
                    type: 'Retenue à la source',
                    reference: ret.invoice_number,
                    amount: parseFloat(ret.retention_amount || 0),
                    isDebit: false, // Montant retenu par le client
                    status: ret.status || 'pending',
                    description: `Retenue ${ret.retention_rate}% - ${ret.note || 'TVA'}`
                })),
                // Paiements reçus (encaissements)
                ...(payments || []).map(pay => ({
                    id: `payment-${pay.id}`,
                    date: pay.payment_date || pay.created_at,
                    type: 'Paiement',
                    reference: pay.order_number,
                    amount: parseFloat(pay.amount || 0),
                    isDebit: false, // Encaissement
                    status: pay.status || 'pending',
                    description: `${pay.payment_method || 'Paiement'} - ${pay.note || ''}`
                })),
                // Chèques reçus
                ...(checks || []).map(chk => ({
                    id: `check-${chk.id}`,
                    date: chk.issue_date,
                    type: 'Chèque',
                    reference: chk.check_number,
                    amount: parseFloat(chk.amount || 0),
                    isDebit: false, // Encaissement
                    status: chk.status || 'pending',
                    description: `${chk.bank_name} - Échéance: ${new Date(chk.due_date).toLocaleDateString()}`
                }))
            ];

            // Trier par date (plus récent en premier)
            allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            setTransactions(allTransactions);
            calculateStats(allTransactions);
        } catch (error) {
            setToast({ visible: true, message: error.message, type: 'error' });
        }
    };

    const calculateStats = (data) => {
        // Total des factures (montants à recevoir)
        const totalInvoices = data
            .filter(t => t.type === 'Facture' && t.status !== 'draft' && t.status !== 'cancelled')
            .reduce((sum, t) => sum + t.amount, 0);

        // Total encaissé (paiements + chèques encaissés)
        const totalReceived = data
            .filter(t => 
                (t.type === 'Paiement' && (t.status === 'received' || t.status === 'paid')) ||
                (t.type === 'Chèque' && t.status === 'encashed')
            )
            .reduce((sum, t) => sum + t.amount, 0);

        // Retenues à la source
        const totalRetained = data
            .filter(t => t.type === 'Retenue à la source' && t.status === 'received')
            .reduce((sum, t) => sum + t.amount, 0);

        // Montant restant = Total factures - (Encaissements + Retenues)
        const remaining = totalInvoices - (totalReceived + totalRetained);
        
        setStats({
            total: totalInvoices,
            paid: totalReceived + totalRetained,
            unpaid: remaining > 0 ? remaining : 0,
            transactionCount: data.length
        });
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadClientData();
        setRefreshing(false);
    }, [clientId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
            case 'received':
            case 'encashed':
                return tTheme.success;
            case 'pending':
            case 'deposited':
                return tTheme.warning;
            case 'draft':
            case 'cancelled':
                return tTheme.textSecondary;
            case 'bounced':
            case 'overdue':
                return tTheme.danger;
            default:
                return tTheme.primary;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid':
                return 'Payé';
            case 'received':
                return 'Reçu';
            case 'encashed':
                return 'Encaissé';
            case 'pending':
                return 'En attente';
            case 'deposited':
                return 'Déposé';
            case 'draft':
                return 'Brouillon';
            case 'cancelled':
                return 'Annulé';
            case 'bounced':
                return 'Impayé';
            case 'overdue':
                return 'En retard';
            case 'partial':
                return 'Partiel';
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[styles.text, { color: tTheme.textSecondary, marginTop: 16 }]}>
                    Chargement...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <ScrollView 
                contentContainerStyle={localStyles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
                }
            >
                {/* Client Info Header */}
                <View style={[localStyles.clientHeader, { backgroundColor: tTheme.card }]}>
                    <Text style={[localStyles.clientName, { color: tTheme.text }]}>
                        {clientName || client?.name}
                    </Text>
                    {client?.email && (
                        <Text style={[localStyles.clientEmail, { color: tTheme.textSecondary }]}>
                            {client.email}
                        </Text>
                    )}
                </View>

                <View style={localStyles.statsGrid}>
                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="document-text-outline" size={24} color={tTheme.primary} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Transactions
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.text }]}>
                        {stats.transactionCount}
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="receipt-outline" size={24} color={tTheme.primary} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Total Factures
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.text }]}>
                        {stats.total.toFixed(2)} DH
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={tTheme.success} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Encaissé
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.success }]}>
                        {stats.paid.toFixed(2)} DH
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="time-outline" size={24} color={tTheme.danger} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Reste à Encaisser
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.danger }]}>
                        {stats.unpaid.toFixed(2)} DH
                    </Text>
                </View>
            </View>

            {/* Transactions Table */}
            <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>
                Historique des transactions
            </Text>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={localStyles.tableWrapper}
                contentContainerStyle={{ minWidth: '100%' }}
            >
                <View style={{ flex: 1, minWidth: isMobile ? 800 : '100%' }}>
                    <ModernTable
                        data={transactions}
                        columns={[
                            {
                                key: 'date',
                                label: 'Date',
                                flex: 1.2,
                                render: (row) => (
                                    <Text style={{ color: tTheme.textSecondary, fontSize: 12 }}>
                                        {new Date(row.date).toLocaleDateString('fr-FR')}
                                    </Text>
                                ),
                            },
                            {
                                key: 'type',
                                label: 'Type',
                                flex: 1.2,
                                render: (row) => (
                                    <View>
                                        <Text style={{ color: tTheme.text, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>
                                            {row.type}
                                        </Text>
                                        <Text style={{ color: tTheme.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                                            {row.reference}
                                        </Text>
                                    </View>
                                ),
                            },
                            {
                                key: 'description',
                                label: 'Description',
                                flex: 1.8,
                                render: (row) => (
                                    <Text style={{ color: tTheme.textSecondary, fontSize: 12 }} numberOfLines={2}>
                                        {row.description || '-'}
                                    </Text>
                                ),
                            },
                            {
                                key: 'amount',
                                label: 'Montant',
                                flex: 1,
                                render: (row) => (
                                    <Text style={{ color: tTheme.text, fontWeight: 'bold', fontSize: 13, textAlign: 'right' }}>
                                        {row.amount.toFixed(3)} TND
                                    </Text>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Statut',
                                flex: 1,
                                render: (row) => {
                                    const statusConfig = {
                                        'paid': { label: 'Payé', variant: 'success' },
                                        'received': { label: 'Reçu', variant: 'success' },
                                        'encashed': { label: 'Encaissé', variant: 'success' },
                                        'pending': { label: 'En attente', variant: 'warning' },
                                        'deposited': { label: 'Déposé', variant: 'warning' },
                                        'draft': { label: 'Brouillon', variant: 'default' },
                                        'cancelled': { label: 'Annulé', variant: 'default' },
                                        'bounced': { label: 'Impayé', variant: 'error' },
                                        'overdue': { label: 'En retard', variant: 'error' },
                                    };
                                    const config = statusConfig[row.status] || { label: row.status, variant: 'default' };
                                    return <ModernStatusBadge label={config.label} variant={config.variant} />;
                                },
                            },
                        ]}
                        theme={theme}
                        loading={loading}
                        emptyMessage="Aucune transaction trouvée"
                    />
                </View>
            </ScrollView>

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
    scrollContent: {
        padding: 20,
    },
    clientHeader: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    clientName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    clientEmail: {
        fontSize: 14,
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        gap: 8,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 8,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 8,
    },
    tableWrapper: {
        marginBottom: 20,
    },
});
