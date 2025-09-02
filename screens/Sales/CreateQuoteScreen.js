import React, { useState, useEffect, useMemo } from 'react';
import { View, TextInput, StyleSheet, Alert, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { themes, translations } from '../../constants/AppConfig';

export default function CreateQuoteScreen({ navigation }) {
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [quoteNumber, setQuoteNumber] = useState('');
    const [issueDate, setIssueDate] = useState(new Date());
    const [expiryDate, setExpiryDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
    const [items, setItems] = useState([{ description: '', quantity: '1', unitPrice: '0' }]);
    const [loading, setLoading] = useState(false);
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('id, name');
            if (error) Alert.alert(t.error, error.message);
            else setClients(data);
        };
        fetchClients();
    }, [t.error]);

    const totalAmount = useMemo(() => {
        return items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            return sum + (quantity * unitPrice);
        }, 0);
    }, [items]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: '1', unitPrice: '0' }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSaveQuote = async () => {
        if (!selectedClientId || !quoteNumber) {
            Alert.alert(t.error, 'Client et numéro de devis sont requis.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('quotes').insert([{
            user_id: user.id,
            client_id: selectedClientId,
            quote_number: quoteNumber,
            issue_date: issueDate.toISOString(),
            expiry_date: expiryDate.toISOString(),
            items: items,
            total_amount: totalAmount,
            status: 'sent',
        }]);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Devis créé avec succès!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <Text style={[styles.label, { color: tTheme.text }]}>Numéro de Devis *</Text>
            <TextInput style={[styles.input, {backgroundColor: tTheme.card, color: tTheme.text}]} value={quoteNumber} onChangeText={setQuoteNumber} />

            <Text style={[styles.label, { color: tTheme.text }]}>Client *</Text>
            <View style={[styles.pickerContainer, {backgroundColor: tTheme.card}]}>
                <Picker selectedValue={selectedClientId} onValueChange={(itemValue) => setSelectedClientId(itemValue)} style={{color: tTheme.text}}>
                    <Picker.Item label="-- Sélectionner un client --" value="" />
                    {clients.map(client => <Picker.Item key={client.id} label={client.name} value={client.id} />)}
                </Picker>
            </View>

            {/* Date Pickers */}
            
            <Text style={styles.sectionTitle}>Articles</Text>
            {items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                    <TextInput style={styles.itemInput} placeholder="Description" value={item.description} onChangeText={(val) => handleItemChange(index, 'description', val)} />
                    <View style={styles.itemRow}>
                        <TextInput style={styles.itemInputSmall} placeholder="Qté" value={item.quantity} onChangeText={(val) => handleItemChange(index, 'quantity', val)} keyboardType="numeric" />
                        <TextInput style={styles.itemInputSmall} placeholder="P.U." value={item.unitPrice} onChangeText={(val) => handleItemChange(index, 'unitPrice', val)} keyboardType="numeric" />
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
                <Text style={styles.totalText}>Total: {totalAmount.toFixed(2)} TND</Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveQuote} disabled={loading}>
                <Text style={styles.saveButtonText}>{loading ? t.saving : t.save}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    label: { fontSize: 16, marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    itemContainer: { padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 5, marginBottom: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    itemInput: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5 },
    itemInputSmall: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, width: '40%' },
    addButton: { flexDirection: 'row', backgroundColor: '#28a745', padding: 10, borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    addButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
    summaryContainer: { marginTop: 20, alignItems: 'flex-end' },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    saveButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 30, marginBottom: 50 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});