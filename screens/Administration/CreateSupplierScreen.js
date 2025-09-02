import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import { Ionicons } from '@expo/vector-icons';

export default function CreateSupplierScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const handleSave = async () => {
        if (!name) {
            Alert.alert(t.error, t.requiredField);
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from('suppliers')
            .insert([{ user_id: user.id, name, email, phone, address, tax_id: taxId }]);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Fournisseur ajouté avec succès!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <Text style={[styles.label, { color: tTheme.text }]}>{t.supplierName} *</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={name} onChangeText={setName} placeholder="Nom de l'entreprise" />
            
            <Text style={[styles.label, { color: tTheme.text }]}>{t.matriculeFiscale}</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={taxId} onChangeText={setTaxId} />

            <Text style={[styles.label, { color: tTheme.text }]}>Email</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" />
            
            <Text style={[styles.label, { color: tTheme.text }]}>Téléphone</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={[styles.label, { color: tTheme.text }]}>{t.address}</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, height: 80 }]} value={address} onChangeText={setAddress} multiline />

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
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 30, elevation: 3, marginTop: 10, marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});