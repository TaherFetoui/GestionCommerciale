import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function PurchaseOrdersListScreen() {
    const navigation = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme, language } = useAuth();
    const tTheme = themes[theme];
    const t = translations[language];

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('purchase_orders').select('*, suppliers (name)').order('order_date', { ascending: false });
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            setOrders(data);
        }
        setLoading(false);
    }, [t.error]);

    useFocusEffect(fetchOrders);

    if (loading) {
        return <View style={[styles.centered, { backgroundColor: tTheme.background }]}><ActivityIndicator size="large" color={tTheme.accent} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.item, { backgroundColor: tTheme.card }]}>
                        <View style={styles.itemHeader}>
                            <Text style={[styles.title, { color: tTheme.text }]}>{item.order_number}</Text>
                            <Text style={[styles.date, { color: tTheme.text }]}>{new Date(item.order_date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.client, { color: tTheme.text }]}>{item.suppliers?.name}</Text>
                        <View style={styles.itemFooter}>
                            <Text style={[styles.amount, { color: tTheme.accent }]}>{item.total_amount?.toFixed(2) || '0.00'} TND</Text>
                            <Text style={{color: tTheme.text}}>{item.status}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ color: tTheme.text, textAlign: 'center', marginTop: 20 }}>Aucune commande trouvée.</Text>}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: tTheme.accent }]} onPress={() => navigation.navigate('CreatePurchaseOrder')}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1 },
    item: { padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 10, elevation: 2 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    title: { fontSize: 16, fontWeight: 'bold' },
    date: { fontSize: 12 },
    client: { fontSize: 14, marginBottom: 10 },
    itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 16, fontWeight: 'bold' },
    fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 20, borderRadius: 28, elevation: 8 },
});