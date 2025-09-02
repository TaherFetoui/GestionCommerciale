import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import { Ionicons } from '@expo/vector-icons';

export default function CreateArticleScreen({ navigation }) {
    const [name, setName] = useState('');
    const [reference, setReference] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [vatRate, setVatRate] = useState('19');
    const [stock, setStock] = useState('0');
    
    const [loading, setLoading] = useState(false);
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const handleSave = async () => {
        if (!name || !salePrice) {
            Alert.alert(t.error, 'Le nom et le prix de vente sont requis.');
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('items')
            .insert([{ 
                user_id: user.id, 
                name, 
                reference, 
                sale_price: parseFloat(salePrice) || 0,
                purchase_price: parseFloat(purchasePrice) || 0,
                vat_rate: parseFloat(vatRate) || 0,
                stock_quantity: parseFloat(stock) || 0,
            }]);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Article ajouté avec succès!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <Text style={[styles.label, { color: tTheme.text }]}>{t.itemName} *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={name} onChangeText={setName} />
            
            <Text style={[styles.label, { color: tTheme.text }]}>{t.reference}</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={reference} onChangeText={setReference} />

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: tTheme.text }]}>Prix de Vente *</Text>
                    <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" />
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: tTheme.text }]}>Prix d'Achat</Text>
                    <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" />
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: tTheme.text }]}>TVA (%)</Text>
                    <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={vatRate} onChangeText={setVatRate} keyboardType="numeric" />
                </View>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: tTheme.text }]}>Stock Initial</Text>
                    <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={stock} onChangeText={setStock} keyboardType="numeric" />
                </View>
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: tTheme.accent }]} onPress={handleSave} disabled={loading}>
                <Ionicons name="save-outline" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>{loading ? t.saving : t.save}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 18, borderRadius: 8, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    column: { flex: 1, marginRight: 10 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 30, elevation: 3, marginTop: 10, marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});