import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
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
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        transactionCount: 0
    });

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];

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
            Alert.alert(t.error, error.message);
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
            Alert.alert(t.error, error.message);
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
        <ScrollView 
            style={[styles.container, { backgroundColor: tTheme.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <View style={localStyles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={[localStyles.backButton, { backgroundColor: tTheme.cardBackground }]}
                >
                    <Ionicons name="arrow-back" size={24} color={tTheme.text} />
                </TouchableOpacity>
                <View style={localStyles.headerText}>
                    <Text style={[localStyles.title, { color: tTheme.text }]}>
                        Rapport Client
                    </Text>
                    <Text style={[localStyles.subtitle, { color: tTheme.textSecondary }]}>
                        {clientName || client?.name}
                    </Text>
                </View>
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

            <View style={[localStyles.transactionsSection, { backgroundColor: tTheme.cardBackground }]}>
                <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>
                    Historique des transactions
                </Text>

                {transactions.length === 0 ? (
                    <View style={localStyles.emptyState}>
                        <Ionicons name="document-outline" size={64} color={tTheme.textSecondary} />
                        <Text style={[localStyles.emptyText, { color: tTheme.textSecondary }]}>
                            Aucune transaction trouvée
                        </Text>
                    </View>
                ) : (
                    transactions.map(transaction => (
                        <View 
                            key={transaction.id} 
                            style={[localStyles.transactionCard, { 
                                backgroundColor: tTheme.background,
                                borderLeftColor: getStatusColor(transaction.status)
                            }]}
                        >
                            <View style={localStyles.transactionHeader}>
                                <View style={localStyles.transactionInfo}>
                                    <Text style={[localStyles.transactionType, { color: tTheme.text }]}>
                                        {transaction.type}
                                    </Text>
                                    <Text style={[localStyles.transactionRef, { color: tTheme.textSecondary }]}>
                                        {transaction.reference}
                                    </Text>
                                </View>
                                <View style={localStyles.transactionRight}>
                                    <Text style={[localStyles.transactionAmount, { color: tTheme.text }]}>
                                        {transaction.amount.toFixed(2)} DH
                                    </Text>
                                    <View style={[localStyles.statusBadge, { 
                                        backgroundColor: getStatusColor(transaction.status) + '20' 
                                    }]}>
                                        <Text style={[localStyles.statusText, { 
                                            color: getStatusColor(transaction.status) 
                                        }]}>
                                            {getStatusText(transaction.status)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={[localStyles.transactionDate, { color: tTheme.textSecondary }]}>
                                {new Date(transaction.date).toLocaleDateString('fr-FR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                            {transaction.description && (
                                <Text style={[localStyles.transactionDesc, { color: tTheme.textSecondary }]}>
                                    {transaction.description}
                                </Text>
                            )}
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const localStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
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
    transactionsSection: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    transactionCard: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 16,
        fontWeight: '600',
    },
    transactionRef: {
        fontSize: 14,
        marginTop: 2,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    transactionDate: {
        fontSize: 12,
        marginTop: 4,
    },
    transactionDesc: {
        fontSize: 12,
        marginTop: 4,
        fontStyle: 'italic',
    },
});
