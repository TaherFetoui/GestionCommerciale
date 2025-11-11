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

export default function SupplierReportScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { supplierId, supplierName } = route.params;
    const { theme, language } = useAuth();
    const { selectedSupplier } = useReporting();
    
    const [supplier, setSupplier] = useState(null);
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
        if (supplierId) {
            loadSupplierData();
        }
    }, [supplierId]);

    const loadSupplierData = async () => {
        setLoading(true);
        const supplierData = await fetchSupplierDetails();
        if (supplierData) {
            await fetchTransactions(supplierData);
        }
        setLoading(false);
    };

    const fetchSupplierDetails = async () => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', supplierId)
            .single();

        if (error) {
            Alert.alert(t.error, error.message);
            return null;
        } else {
            setSupplier(data);
            return data;
        }
    };

    const fetchTransactions = async (supplierData) => {
        try {
            const supplierNameValue = supplierData?.name || route.params?.supplierName || '';

            // Récupérer les bons de commande
            const { data: purchaseOrders, error: poError } = await supabase
                .from('purchase_orders')
                .select('*')
                .eq('supplier_id', supplierId)
                .order('created_at', { ascending: false });

            if (poError) throw poError;

            // Récupérer les retenues à la source fournisseurs
            const { data: returns, error: returnsError } = await supabase
                .from('supplier_returns')
                .select('*')
                .eq('supplier', supplierNameValue)
                .order('retention_date', { ascending: false });

            if (returnsError) console.log('Erreur retenues:', returnsError);

            // Récupérer les ordres de paiement fournisseurs
            const { data: payments, error: paymentsError } = await supabase
                .from('supplier_payment_orders')
                .select('*')
                .eq('supplier', supplierNameValue)
                .order('payment_date', { ascending: false });

            if (paymentsError) console.log('Erreur paiements:', paymentsError);

            // Récupérer les chèques émis au fournisseur
            const { data: checks, error: checksError } = await supabase
                .from('checks')
                .select('*')
                .eq('check_type', 'issued')
                .eq('client_supplier', supplierNameValue)
                .order('issue_date', { ascending: false });

            if (checksError) console.log('Erreur chèques:', checksError);

            // Combiner et formater TOUTES les transactions
            const allTransactions = [
                // Bons de commande (montants à payer)
                ...(purchaseOrders || []).map(po => ({
                    id: `purchase-${po.id}`,
                    date: po.created_at,
                    type: 'Bon de commande',
                    reference: po.order_number,
                    amount: parseFloat(po.total_amount || 0),
                    isDebit: true, // Nous devons payer
                    status: po.status || 'draft',
                    description: po.notes || 'Commande d\'achat'
                })),
                // Retenues à la source (montants retenus)
                ...(returns || []).map(ret => ({
                    id: `return-${ret.id}`,
                    date: ret.retention_date,
                    type: 'Retenue à la source',
                    reference: ret.invoice_number,
                    amount: parseFloat(ret.retention_amount || 0),
                    isDebit: false, // Montant retenu sur paiement
                    status: ret.status || 'pending',
                    description: `Retenue ${ret.retention_rate}% - ${ret.note || 'TVA'}`
                })),
                // Paiements effectués
                ...(payments || []).map(pay => ({
                    id: `payment-${pay.id}`,
                    date: pay.payment_date || pay.created_at,
                    type: 'Paiement',
                    reference: pay.order_number,
                    amount: parseFloat(pay.amount || 0),
                    isDebit: false, // Décaissement
                    status: pay.status || 'pending',
                    description: `${pay.payment_method || 'Paiement'} - ${pay.note || ''}`
                })),
                // Chèques émis
                ...(checks || []).map(chk => ({
                    id: `check-${chk.id}`,
                    date: chk.issue_date,
                    type: 'Chèque émis',
                    reference: chk.check_number,
                    amount: parseFloat(chk.amount || 0),
                    isDebit: false, // Décaissement
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
        // Total des bons de commande (montants à payer)
        const totalOrders = data
            .filter(t => t.type === 'Bon de commande' && t.status !== 'draft' && t.status !== 'cancelled')
            .reduce((sum, t) => sum + t.amount, 0);

        // Total payé (paiements + chèques encaissés)
        const totalPaid = data
            .filter(t => 
                (t.type === 'Paiement' && (t.status === 'paid' || t.status === 'approved')) ||
                (t.type === 'Chèque émis' && t.status === 'encashed')
            )
            .reduce((sum, t) => sum + t.amount, 0);

        // Retenues à la source
        const totalRetained = data
            .filter(t => t.type === 'Retenue à la source' && t.status === 'paid')
            .reduce((sum, t) => sum + t.amount, 0);

        // Montant restant = Total commandes - (Paiements + Retenues)
        const remaining = totalOrders - (totalPaid + totalRetained);
        
        setStats({
            total: totalOrders,
            paid: totalPaid + totalRetained,
            unpaid: remaining > 0 ? remaining : 0,
            transactionCount: data.length
        });
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSupplierData();
        setRefreshing(false);
    }, [supplierId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
            case 'received':
            case 'encashed':
            case 'approved':
                return tTheme.success;
            case 'pending':
            case 'ordered':
            case 'deposited':
                return tTheme.warning;
            case 'draft':
            case 'cancelled':
                return tTheme.textSecondary;
            case 'bounced':
            case 'rejected':
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
            case 'approved':
                return 'Approuvé';
            case 'pending':
                return 'En attente';
            case 'ordered':
                return 'Commandé';
            case 'deposited':
                return 'Déposé';
            case 'draft':
                return 'Brouillon';
            case 'cancelled':
                return 'Annulé';
            case 'bounced':
                return 'Impayé';
            case 'rejected':
                return 'Rejeté';
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
                        Rapport Fournisseur
                    </Text>
                    <Text style={[localStyles.subtitle, { color: tTheme.textSecondary }]}>
                        {supplierName || supplier?.name}
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
                        Total Commandes
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.text }]}>
                        {stats.total.toFixed(2)} DH
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={tTheme.success} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Décaissé
                    </Text>
                    <Text style={[localStyles.statValue, { color: tTheme.success }]}>
                        {stats.paid.toFixed(2)} DH
                    </Text>
                </View>

                <View style={[localStyles.statCard, { backgroundColor: tTheme.cardBackground }]}>
                    <Ionicons name="time-outline" size={24} color={tTheme.danger} />
                    <Text style={[localStyles.statLabel, { color: tTheme.textSecondary }]}>
                        Reste à Payer
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
