import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CompanyInfoScreen() {
    const { user, theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState({ name: '', tax_id: '', address: '', phone: '', email: '' });

    const fetchCompanyInfo = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('company_info')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            Alert.alert(t.error, error.message);
        } else if (data) {
            setCompany(data);
        }
        setLoading(false);
    }, [user, t.error]);

    useFocusEffect(fetchCompanyInfo);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase.from('company_info').upsert({ ...company, user_id: user.id }, { onConflict: 'user_id' });

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Informations enregistrées.');
        }
        setSaving(false);
    };
    
    const handleChange = (field, value) => {
        setCompany(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={tTheme.accent} /></View>;
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: tTheme.background }]}>
            <Text style={[styles.label, { color: tTheme.text }]}>{t.raisonSociale}</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={company.name} onChangeText={(val) => handleChange('name', val)} />
            
            <Text style={[styles.label, { color: tTheme.text }]}>{t.matriculeFiscale}</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={company.tax_id} onChangeText={(val) => handleChange('tax_id', val)} />

            <Text style={[styles.label, { color: tTheme.text }]}>Email</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={company.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" />
            
            <Text style={[styles.label, { color: tTheme.text }]}>Téléphone</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text }]} value={company.phone} onChangeText={(val) => handleChange('phone', val)} keyboardType="phone-pad" />

            <Text style={[styles.label, { color: tTheme.text }]}>{t.address}</Text>
            <TextInput style={[styles.input, { backgroundColor: tTheme.card, color: tTheme.text, height: 80 }]} value={company.address} onChangeText={(val) => handleChange('address', val)} multiline />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: tTheme.accent }]} onPress={handleSave} disabled={saving}>
                <Ionicons name="save-outline" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>{saving ? t.saving : t.save}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    label: { fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 18, borderRadius: 8, fontSize: 16 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 30, elevation: 3, marginTop: 10, marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});