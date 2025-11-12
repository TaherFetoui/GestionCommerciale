import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from '../../components/Toast';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CreatePurchaseOrderScreen({ navigation }) {
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];
    const globalStyles = getGlobalStyles(theme);

    const [suppliers, setSuppliers] = useState([]);
    const [articles, setArticles] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [selectedSupplierName, setSelectedSupplierName] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [status, setStatus] = useState('pending');
    const [lineItems, setLineItems] = useState([{ item_id: null, item_name: '', quantity: '1', purchase_price: '0' }]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    useEffect(() => {
        const fetchData = async () => {
            setInitialLoading(true);
            
            // Fetch suppliers
            const { data: suppliersData, error: suppliersError } = await supabase
                .from('suppliers')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name');
                
            if (suppliersError) {
                console.error('Error fetching suppliers:', suppliersError);
                Alert.alert(t.error || 'Erreur', suppliersError.message);
            } else {
                setSuppliers(suppliersData || []);
            }

            // Fetch articles
            const { data: articlesData, error: articlesError } = await supabase
                .from('items')
                .select('id, name, purchase_price')
                .eq('user_id', user.id)
                .order('name');
                
            if (articlesError) {
                console.error('Error fetching articles:', articlesError);
                Alert.alert(t.error || 'Erreur', articlesError.message);
            } else {
                setArticles(articlesData || []);
            }
            
            // Generate order number
            generateOrderNumber();
            
            setInitialLoading(false);
        };
        fetchData();
    }, [t.error, user.id]);

    const generateOrderNumber = async () => {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('order_number')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (!error && data && data.length > 0) {
            const lastNumber = data[0].order_number;
            const match = lastNumber.match(/(\d+)$/);
            if (match) {
                const nextNumber = parseInt(match[1]) + 1;
                setOrderNumber(`CMD-${String(nextNumber).padStart(4, '0')}`);
            } else {
                setOrderNumber('CMD-0001');
            }
        } else {
            setOrderNumber('CMD-0001');
        }
    };

    const totalHT = useMemo(() => (
        lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0), 0)
    ), [lineItems]);

    const totalVAT = useMemo(() => totalHT * 0.19, [totalHT]); // 19% VAT
    const totalTTC = useMemo(() => totalHT + totalVAT, [totalHT, totalVAT]);

    const handleSupplierChange = (supplierId) => {
        // Gérer la valeur spéciale vide
        const actualId = supplierId === '__empty__' ? '' : supplierId;
        setSelectedSupplierId(actualId);
        
        const supplier = suppliers.find(s => s.id === actualId);
        if (supplier) {
            setSelectedSupplierName(supplier.name);
        } else {
            setSelectedSupplierName('');
        }
        // Les articles ne sont plus filtrés - tous les articles sont toujours disponibles
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...lineItems];
        newItems[index][field] = value;
        
        // Auto-fill price and name when an item is selected from the picker
        if (field === 'item_id') {
            const selectedArticle = articles.find(a => a.id === value);
            if (selectedArticle) {
                newItems[index]['item_name'] = selectedArticle.name;
                newItems[index]['purchase_price'] = selectedArticle.purchase_price?.toString() || '0';
            } else {
                // Si on désélectionne (valeur vide), ne pas effacer le nom saisi manuellement
                // Juste effacer l'ID
            }
        }
        
        // Si l'utilisateur saisit manuellement le nom, effacer l'item_id pour éviter la confusion
        if (field === 'item_name' && value && value.trim()) {
            // Ne pas effacer l'item_id car l'utilisateur peut vouloir modifier le nom d'un article sélectionné
            // newItems[index]['item_id'] = null;
        }
        
        setLineItems(newItems);
    };

    const handleAddItem = () => {
        setLineItems([...lineItems, { item_id: null, item_name: '', quantity: '1', purchase_price: '0' }]);
    };
    
    const handleRemoveItem = (index) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        } else {
            Alert.alert('Information', 'Vous devez avoir au moins un article.');
        }
    };

    const handleSave = async () => {
        // Validation
        if (!selectedSupplierId) {
            return Alert.alert('Champ requis', 'Veuillez sélectionner un fournisseur.');
        }
        if (!orderNumber.trim()) {
            return Alert.alert('Champ requis', 'Veuillez entrer un numéro de commande.');
        }
        
        // Un article est valide seulement s'il a un item_id (sélectionné dans la liste)
        const validItems = lineItems
            .filter(item => item.item_id)
            .map(item => ({
                item_id: item.item_id,
                item_name: item.item_name,
                quantity: parseFloat(item.quantity) || 0,
                purchase_price: parseFloat(item.purchase_price) || 0,
            }));
        
        if (validItems.length === 0) {
            return Alert.alert('Articles requis', 'Veuillez sélectionner au moins un article à la commande.');
        }
        
        setLoading(true);
        
        try {
            const orderData = {
                user_id: user.id,
                supplier_id: selectedSupplierId,
                order_number: orderNumber.trim(),
                status: status,
                items: validItems,
            };
            
            const { error } = await supabase.from('purchase_orders').insert([orderData]);

            if (error) {
                console.error('Error creating purchase order:', error);
                setLoading(false);
                setToast({
                    visible: true,
                    message: 'Erreur lors de la création de la commande',
                    type: 'error',
                });
            } else {
                setLoading(false);
                setToast({
                    visible: true,
                    message: 'Commande créée avec succès!',
                    type: 'success',
                });
                // Navigate after a delay to show the toast
                setTimeout(() => {
                    navigation.navigate('PurchaseOrdersList');
                }, 1500);
            }
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
            setToast({
                visible: true,
                message: 'Une erreur est survenue lors de la création de la commande',
                type: 'error',
            });
        }
    };

    if (initialLoading) {
        return (
            <View style={[globalStyles.container, localStyles.centered, { backgroundColor: tTheme.background }]}>
                <ActivityIndicator size="large" color={tTheme.primary} />
                <Text style={[localStyles.loadingText, { color: tTheme.textSecondary }]}>Chargement...</Text>
            </View>
        );
    }

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                theme={theme}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ScrollView 
                style={[globalStyles.container, { backgroundColor: tTheme.background }]}
                showsVerticalScrollIndicator={false}
            >
            <View style={localStyles.content}>
                {/* Order Info Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="document-text" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Informations de commande</Text>
                    </View>
                    
                    <View style={localStyles.cardContent}>
                        <Text style={[localStyles.label, { color: tTheme.text }]}>
                            Numéro de commande <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        <TextInput
                            style={[localStyles.input, { 
                                backgroundColor: tTheme.background, 
                                color: tTheme.text,
                                borderColor: tTheme.border
                            }]}
                            value={orderNumber}
                            onChangeText={setOrderNumber}
                            placeholder="Ex: CMD-0001"
                            placeholderTextColor={tTheme.textSecondary}
                        />

                        <Text style={[localStyles.label, { color: tTheme.text, marginTop: 16 }]}>
                            Fournisseur <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        <View style={[localStyles.pickerContainer, { 
                            backgroundColor: tTheme.background,
                            borderColor: tTheme.border
                        }]}>
                            <Picker
                                selectedValue={selectedSupplierId || '__empty__'}
                                onValueChange={handleSupplierChange}
                                style={{ color: tTheme.text }}
                            >
                                <Picker.Item label="-- Sélectionner un fournisseur --" value="__empty__" />
                                {suppliers.map(s => (
                                    <Picker.Item key={s.id} label={s.name} value={s.id} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={[localStyles.label, { color: tTheme.text, marginTop: 16 }]}>Statut</Text>
                        <View style={[localStyles.pickerContainer, { 
                            backgroundColor: tTheme.background,
                            borderColor: tTheme.border
                        }]}>
                            <Picker
                                selectedValue={status}
                                onValueChange={setStatus}
                                style={{ color: tTheme.text }}
                            >
                                <Picker.Item label="En attente" value="pending" />
                                <Picker.Item label="Confirmé" value="confirmed" />
                                <Picker.Item label="Reçu" value="received" />
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Items Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="list" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Articles</Text>
                    </View>
                    
                    <View style={localStyles.cardContent}>
                        {lineItems.map((item, index) => (
                            <View 
                                key={index} 
                                style={[
                                    localStyles.itemCard,
                                    { 
                                        backgroundColor: tTheme.background,
                                        borderColor: tTheme.border
                                    }
                                ]}
                            >
                                <View style={localStyles.itemHeader}>
                                    <Text style={[localStyles.itemNumber, { color: tTheme.textSecondary }]}>
                                        Article #{index + 1}
                                    </Text>
                                    {lineItems.length > 1 && (
                                        <TouchableOpacity
                                            onPress={() => handleRemoveItem(index)}
                                            style={localStyles.deleteButton}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={[localStyles.miniLabel, { color: tTheme.textSecondary, marginBottom: 6 }]}>
                                    Article / Description
                                </Text>
                                <View style={[localStyles.pickerContainer, { 
                                    backgroundColor: tTheme.card,
                                    borderColor: tTheme.border,
                                    marginBottom: 4
                                }]}>
                                    <Picker
                                        selectedValue={item.item_id || '__empty__'}
                                        onValueChange={(val) => {
                                            const actualVal = val === '__empty__' ? null : val;
                                            handleItemChange(index, 'item_id', actualVal);
                                        }}
                                        style={{ color: tTheme.text }}
                                    >
                                        <Picker.Item 
                                            label="-- Sélectionner un article --" 
                                            value="__empty__" 
                                        />
                                        {articles && articles.length > 0 && articles.map(a => (
                                            <Picker.Item key={a.id} label={a.name} value={a.id} />
                                        ))}
                                    </Picker>
                                </View>

                                <View style={localStyles.itemRow}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={[localStyles.miniLabel, { color: tTheme.textSecondary }]}>
                                            Quantité
                                        </Text>
                                        <TextInput
                                            style={[localStyles.input, { 
                                                backgroundColor: tTheme.card,
                                                color: tTheme.text,
                                                borderColor: tTheme.border
                                            }]}
                                            value={item.quantity}
                                            onChangeText={(val) => handleItemChange(index, 'quantity', val)}
                                            keyboardType="numeric"
                                            placeholder="1"
                                            placeholderTextColor={tTheme.textSecondary}
                                        />
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[localStyles.miniLabel, { color: tTheme.textSecondary }]}>
                                            Prix unitaire (TND)
                                        </Text>
                                        <TextInput
                                            style={[localStyles.input, { 
                                                backgroundColor: tTheme.card,
                                                color: tTheme.text,
                                                borderColor: tTheme.border
                                            }]}
                                            value={item.purchase_price}
                                            onChangeText={(val) => handleItemChange(index, 'purchase_price', val)}
                                            keyboardType="decimal-pad"
                                            placeholder="0.000"
                                            placeholderTextColor={tTheme.textSecondary}
                                        />
                                    </View>
                                </View>

                                {(item.item_id || (item.item_name && item.item_name.trim())) && (
                                    <View style={[localStyles.subtotalContainer, { borderTopColor: tTheme.border }]}>
                                        <Text style={[localStyles.subtotalLabel, { color: tTheme.textSecondary }]}>
                                            Sous-total
                                        </Text>
                                        <Text style={[localStyles.subtotalValue, { color: tTheme.text }]}>
                                            {((parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0)).toFixed(3)} TND
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}

                        <TouchableOpacity
                            style={[localStyles.addButton, { backgroundColor: tTheme.primary + '15' }]}
                            onPress={handleAddItem}
                        >
                            <Ionicons name="add-circle" size={22} color={tTheme.primary} />
                            <Text style={[localStyles.addButtonText, { color: tTheme.primary }]}>
                                Ajouter un article
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Totals Card */}
                <View style={[localStyles.card, { backgroundColor: tTheme.card, ...tTheme.shadow.small }]}>
                    <View style={localStyles.cardHeader}>
                        <Ionicons name="calculator" size={20} color={tTheme.primary} />
                        <Text style={[localStyles.cardTitle, { color: tTheme.text }]}>Récapitulatif</Text>
                    </View>
                    
                    <View style={localStyles.cardContent}>
                        <View style={localStyles.totalRow}>
                            <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>
                                Total HT
                            </Text>
                            <Text style={[localStyles.totalValue, { color: tTheme.text }]}>
                                {totalHT.toFixed(3)} TND
                            </Text>
                        </View>

                        <View style={localStyles.totalRow}>
                            <Text style={[localStyles.totalLabel, { color: tTheme.textSecondary }]}>
                                TVA (19%)
                            </Text>
                            <Text style={[localStyles.totalValue, { color: tTheme.text }]}>
                                {totalVAT.toFixed(3)} TND
                            </Text>
                        </View>

                        <View style={[localStyles.grandTotalRow, { borderTopColor: tTheme.border }]}>
                            <Text style={[localStyles.grandTotalLabel, { color: tTheme.text }]}>
                                Total TTC
                            </Text>
                            <Text style={[localStyles.grandTotalValue, { color: tTheme.primary }]}>
                                {totalTTC.toFixed(3)} TND
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={localStyles.actionsContainer}>
                    <TouchableOpacity
                        style={[localStyles.cancelButton, { 
                            backgroundColor: tTheme.background,
                            borderColor: tTheme.border
                        }]}
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                    >
                        <Text style={[localStyles.cancelButtonText, { color: tTheme.text }]}>
                            Annuler
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[localStyles.saveButton, { backgroundColor: tTheme.primary }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={localStyles.saveButtonText}>Créer la commande</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
        </>
    );
}

const localStyles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    miniLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    itemCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemNumber: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    deleteButton: {
        padding: 4,
    },
    orText: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 8,
    },
    noArticlesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    noArticlesText: {
        fontSize: 12,
        flex: 1,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    subtotalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    subtotalLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    subtotalValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 4,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '600',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 2,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    grandTotalValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 40,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    itemContainer: { padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    itemInputSmall: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, width: '40%' },
    addButton: { flexDirection: 'row', backgroundColor: '#28a745', padding: 10, borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    addButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
    summaryContainer: { marginTop: 20, alignItems: 'flex-end' },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    saveButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 30, marginBottom: 50 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});