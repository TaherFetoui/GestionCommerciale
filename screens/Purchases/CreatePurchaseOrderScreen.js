import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';

export default function CreatePurchaseOrderScreen({ navigation }) {
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const [suppliers, setSuppliers] = useState([]);
    const [articles, setArticles] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [status, setStatus] = useState('ordered');
    const [lineItems, setLineItems] = useState([{ item_id: null, quantity: '1', purchase_price: '0' }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const { data: suppliersData, error: suppliersError } = await supabase.from('suppliers').select('id, name');
            if (suppliersError) Alert.alert(t.error, suppliersError.message);
            else setSuppliers(suppliersData);

            const { data: articlesData, error: articlesError } = await supabase.from('items').select('id, name, purchase_price');
            if (articlesError) Alert.alert(t.error, articlesError.message);
            else setArticles(articlesData);
        };
        fetchData();
    }, [t.error]);

    const totalAmount = useMemo(() => (
        lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.purchase_price) || 0), 0)
    ), [lineItems]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...lineItems];
        newItems[index][field] = value;
        // Auto-fill price when an item is selected
        if (field === 'item_id') {
            const selectedArticle = articles.find(a => a.id === value);
            if (selectedArticle) {
                newItems[index]['purchase_price'] = selectedArticle.purchase_price?.toString() || '0';
            }
        }
        setLineItems(newItems);
    };

    const handleAddItem = () => setLineItems([...lineItems, { item_id: null, quantity: '1', purchase_price: '0' }]);
    const handleRemoveItem = (index) => setLineItems(lineItems.filter((_, i) => i !== index));

    const handleSave = async () => {
        if (!selectedSupplierId || !orderNumber) {
            return Alert.alert(t.error, 'Fournisseur et numéro de commande sont requis.');
        }
        setLoading(true);
        const { error } = await supabase.from('purchase_orders').insert([{
            user_id: user.id,
            supplier_id: selectedSupplierId,
            order_number: orderNumber,
            status: status,
            items: lineItems.filter(item => item.item_id), // Filter out empty lines
            total_amount: totalAmount,
        }]);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Commande fournisseur créée avec succès!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <Text style={[styles.label, { color: tTheme.text }]}>Numéro de Commande *</Text>
            <TextInput style={[styles.input, {backgroundColor: tTheme.card, color: tTheme.text}]} value={orderNumber} onChangeText={setOrderNumber} />

            <Text style={[styles.label, { color: tTheme.text }]}>Fournisseur *</Text>
            <View style={[styles.pickerContainer, {backgroundColor: tTheme.card}]}>
                <Picker selectedValue={selectedSupplierId} onValueChange={setSelectedSupplierId} style={{color: tTheme.text}}>
                    <Picker.Item label="-- Sélectionner un fournisseur --" value="" />
                    {suppliers.map(s => <Picker.Item key={s.id} label={s.name} value={s.id} />)}
                </Picker>
            </View>
            
            <Text style={[styles.sectionTitle, {color: tTheme.text}]}>Articles</Text>
            {lineItems.map((item, index) => (
                <View key={index} style={[styles.itemContainer, {borderColor: tTheme.accent}]}>
                     <View style={[styles.pickerContainer, {backgroundColor: tTheme.card}]}>
                        <Picker selectedValue={item.item_id} onValueChange={(val) => handleItemChange(index, 'item_id', val)} style={{color: tTheme.text}}>
                            <Picker.Item label="-- Sélectionner un article --" value={null} />
                            {articles.map(a => <Picker.Item key={a.id} label={a.name} value={a.id} />)}
                        </Picker>
                    </View>
                    <View style={styles.itemRow}>
                        <TextInput style={[styles.itemInputSmall, {backgroundColor: tTheme.card, color: tTheme.text}]} placeholder="Qté" value={item.quantity} onChangeText={(val) => handleItemChange(index, 'quantity', val)} keyboardType="numeric" />
                        <TextInput style={[styles.itemInputSmall, {backgroundColor: tTheme.card, color: tTheme.text}]} placeholder="Prix d'achat" value={item.purchase_price} onChangeText={(val) => handleItemChange(index, 'purchase_price', val)} keyboardType="numeric" />
                        <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Ionicons name="add-circle-outline" size={22} color="#fff" />
                <Text style={styles.addButtonText}>Ajouter un article</Text>
            </TouchableOpacity>

             <View style={styles.summaryContainer}>
                <Text style={[styles.totalText, {color: tTheme.text}]}>Total: {totalAmount.toFixed(2)} TND</Text>
            </View>

            <TouchableOpacity style={[styles.saveButton, {backgroundColor: tTheme.accent}]} onPress={handleSave} disabled={loading}>
                <Text style={styles.saveButtonText}>{loading ? t.saving : t.save}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

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