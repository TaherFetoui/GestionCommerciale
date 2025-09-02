import React, { useState, useEffect, useMemo } from 'react';
import {
    View, TextInput, StyleSheet, Alert, ScrollView, Text, TouchableOpacity, Platform
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function CreateInvoiceScreen({ navigation }) {
    const { user } = useAuth();
    // Form State
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [issueDate, setIssueDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)));
    const [paymentMethod, setPaymentMethod] = useState('Chèque');
    const [lineItems, setLineItems] = useState([{ ref: '', description: '', quantity: '1', unitPrice: '0', vatRate: '19' }]);
    const [fiscalStamp, setFiscalStamp] = useState('1.000');
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);

    // Fetch clients on component mount
    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('id, name');
            if (error) Alert.alert('Error fetching clients', error.message);
            else setClients(data);
        };
        fetchClients();
    }, []);
    
    // --- Automatic Calculations ---
    const { totalHT, totalVAT, totalTTC, vatSummary } = useMemo(() => {
        let ht = 0;
        let vat = 0;
        const summary = {};

        lineItems.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const itemHT = quantity * unitPrice;
            const vatRate = parseFloat(item.vatRate) || 0;
            const itemVAT = itemHT * (vatRate / 100);

            ht += itemHT;
            vat += itemVAT;

            if (summary[vatRate]) {
                summary[vatRate].base += itemHT;
                summary[vatRate].amount += itemVAT;
            } else {
                summary[vatRate] = { base: itemHT, amount: itemVAT };
            }
        });

        const stamp = parseFloat(fiscalStamp) || 0;
        const ttc = ht + vat + stamp;
        
        return { totalHT: ht, totalVAT: vat, totalTTC: ttc, vatSummary: summary };
    }, [lineItems, fiscalStamp]);

    // --- Line Item Handlers ---
    const handleItemChange = (index, field, value) => {
        const newItems = [...lineItems];
        newItems[index][field] = value;
        setLineItems(newItems);
    };

    const handleAddItem = () => {
        setLineItems([...lineItems, { ref: '', description: '', quantity: '1', unitPrice: '0', vatRate: '19' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = lineItems.filter((_, i) => i !== index);
        setLineItems(newItems);
    };

    // --- Date Handlers ---
    const onIssueDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || issueDate;
        setShowIssueDatePicker(Platform.OS === 'ios');
        setIssueDate(currentDate);
    };

    const onDueDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || dueDate;
        setShowDueDatePicker(Platform.OS === 'ios');
        setDueDate(currentDate);
    };

    // --- Save Invoice ---
    const handleSaveInvoice = async () => {
        if (!selectedClientId || !invoiceNumber) {
            Alert.alert('Error', 'Please select a client and enter an invoice number.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('invoices').insert([{
            user_id: user.id,
            client_id: selectedClientId,
            invoice_number: invoiceNumber,
            issue_date: issueDate.toISOString(),
            due_date: dueDate.toISOString(),
            payment_method: paymentMethod,
            items: lineItems, // Save all items as JSON
            fiscal_stamp: parseFloat(fiscalStamp) || 0,
            total_ht: totalHT,
            total_vat: totalVAT,
            total_amount: totalTTC, // Total TTC goes into the main amount column
            status: 'awaiting_payment',
        }]);

        if (error) {
            Alert.alert('Error creating invoice', error.message);
        } else {
            Alert.alert('Success', 'Invoice created!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <TextInput style={styles.input} placeholder="Invoice Number (e.g., FA250103)" value={invoiceNumber} onChangeText={setInvoiceNumber} />
            
            <View style={styles.dateContainer}>
                <TouchableOpacity onPress={() => setShowIssueDatePicker(true)} style={styles.datePickerButton}>
                    <Text>Issue Date: {issueDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDueDatePicker(true)} style={styles.datePickerButton}>
                    <Text>Due Date: {dueDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
            </View>

            {showIssueDatePicker && <DateTimePicker value={issueDate} mode="date" display="default" onChange={onIssueDateChange} />}
            {showDueDatePicker && <DateTimePicker value={dueDate} mode="date" display="default" onChange={onDueDateChange} />}

            <Text style={styles.label}>Client</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={selectedClientId} onValueChange={(itemValue) => setSelectedClientId(itemValue)}>
                    <Picker.Item label="-- Select a Client --" value="" />
                    {clients.map(client => (
                        <Picker.Item key={client.id} label={client.name} value={client.id} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Payment Method</Text>
            <TextInput style={styles.input} placeholder="e.g., Chèque, Virement..." value={paymentMethod} onChangeText={setPaymentMethod} />
            
            <Text style={styles.sectionTitle}>Line Items</Text>
            {lineItems.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                    <TextInput style={styles.itemInput} placeholder="Description" value={item.description} onChangeText={(val) => handleItemChange(index, 'description', val)} />
                    <View style={styles.itemRow}>
                        <TextInput style={styles.itemInputSmall} placeholder="Qty" value={item.quantity} onChangeText={(val) => handleItemChange(index, 'quantity', val)} keyboardType="numeric" />
                        <TextInput style={styles.itemInputSmall} placeholder="Unit Price" value={item.unitPrice} onChangeText={(val) => handleItemChange(index, 'unitPrice', val)} keyboardType="numeric" />
                        <TextInput style={styles.itemInputSmall} placeholder="VAT %" value={item.vatRate} onChangeText={(val) => handleItemChange(index, 'vatRate', val)} keyboardType="numeric" />
                        <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
                <Ionicons name="add-circle-outline" size={22} color="#fff" />
                <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                    <Text>Total HT</Text>
                    <Text>{totalHT.toFixed(3)} TND</Text>
                </View>
                {Object.entries(vatSummary).map(([rate, totals]) => (
                    <View style={styles.summaryRow} key={rate}>
                        <Text>VAT ({rate}%)</Text>
                        <Text>{totals.amount.toFixed(3)} TND</Text>
                    </View>
                ))}
                <View style={styles.summaryRow}>
                    <Text>Fiscal Stamp</Text>
                    <TextInput style={styles.stampInput} value={fiscalStamp} onChangeText={setFiscalStamp} keyboardType="numeric" />
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalText}>Total TTC</Text>
                    <Text style={styles.totalText}>{totalTTC.toFixed(3)} TND</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveInvoice} disabled={loading}>
                <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Invoice"}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    label: { fontSize: 16, marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 15 },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    datePickerButton: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: '48%' },
    itemContainer: { padding: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 5, marginBottom: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    itemInput: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5 },
    itemInputSmall: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, width: '25%' },
    addButton: { flexDirection: 'row', backgroundColor: '#28a745', padding: 10, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
    summaryContainer: { marginTop: 10, padding: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 5 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    stampInput: { borderWidth: 1, borderColor: '#ccc', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 5, textAlign: 'right' },
    totalRow: { borderTopWidth: 1, borderColor: '#ccc', marginTop: 10, paddingTop: 10 },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    saveButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 30, marginBottom: 50 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});