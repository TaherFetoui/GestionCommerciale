import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SuppliersListScreen() {
    const navigation = useNavigation();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const fetchSuppliers = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setSuppliers(data);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(fetchSuppliers);

    if (loading) {
        return <View style={[styles.centered, { backgroundColor: tTheme.background }]}><ActivityIndicator size="large" color={tTheme.accent} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <FlatList
                data={suppliers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.item, { backgroundColor: tTheme.card }]}>
                        <View>
                            <Text style={[styles.title, { color: tTheme.text }]}>{item.name}</Text>
                            <Text style={{ color: tTheme.text }}>{item.email || 'Pas d\'email'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={tTheme.text} />
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ color: tTheme.text, textAlign: 'center', marginTop: 20 }}>Aucun fournisseur trouvé.</Text>}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: tTheme.accent }]} onPress={() => navigation.navigate('CreateSupplier')}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1 },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 10, elevation: 2 },
    title: { fontSize: 18, fontWeight: 'bold' },
    fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, borderRadius: 28, elevation: 8 },
});