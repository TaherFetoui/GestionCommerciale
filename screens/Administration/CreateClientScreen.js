import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function CreateClientScreen() {
    const navigation = useNavigation();
    const { user, theme, language } = useAuth();
    const [name, setName] = useState('');
    const [taxId, setTaxId] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];

    const handleSaveClient = async () => {
        if (!name) {
            Alert.alert(t.error, `${t.raisonSociale} ${t.requiredField}`);
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('clients').insert([{
            user_id: user.id,
            name: name,
            raison_sociale: name,
            matricule_fiscale: taxId,
            address: address,
            phone: phone,
            email: email,
        }]);

        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Client ajouté avec succès!');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <View style={[localStyles.container, { backgroundColor: tTheme.background }]}>
            <SafeAreaView style={[localStyles.formContainer, { backgroundColor: tTheme.card, borderColor: tTheme.border }]}>
                <ScrollView>
                    <View style={[localStyles.header, { borderBottomColor: tTheme.border }]}>
                        <Text style={[localStyles.title, { color: tTheme.text }]}>{t.createClient}</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="close" size={26} color={tTheme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ padding: 20 }}>
                        <Text style={styles.label}>{t.raisonSociale} *</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} />

                        <Text style={styles.label}>{t.matriculeFiscale}</Text>
                        <TextInput style={styles.input} value={taxId} onChangeText={setTaxId} />
                        
                        <View style={localStyles.inputRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.label}>Téléphone</Text>
                                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                            </View>
                        </View>
                        
                        <Text style={styles.label}>{t.address}</Text>
                        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={address} onChangeText={setAddress} multiline />
                    </View>
                </ScrollView>
                <View style={[localStyles.footer, { borderTopColor: tTheme.border }]}>
                    <TouchableOpacity style={[styles.primaryButton, { width: '100%' }]} onPress={handleSaveClient} disabled={loading}>
                        <Text style={styles.primaryButtonText}>{loading ? t.saving : t.save}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        width: '90%',
        maxWidth: 500,
        maxHeight: '90%',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    inputRow: {
        flexDirection: 'row',
    },
});