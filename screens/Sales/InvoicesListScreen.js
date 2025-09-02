import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import { Ionicons } from '@expo/vector-icons';

export default function InvoicesListScreen({ navigation }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme, language } = useAuth();
    
    const tTheme = themes[theme];
    const tStrings = translations[language];

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('invoices')
            .select('*, clients (name)')
            .order('issue_date', { ascending: false });
        
        if (error) {
            console.error('Error fetching invoices:', error);
        } else {
            setInvoices(data);
        }
        setLoading(false);
    }, []);

    useFocusEffect(fetchInvoices);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid':
                return { color: 'green', fontWeight: 'bold' };
            case 'overdue':
                return { color: 'red', fontWeight: 'bold' };
            case 'awaiting_payment':
            default:
                return { color: tTheme.text };
        }
    };

    if (loading) {
        return <View style={[styles.centered, { backgroundColor: tTheme.background }]}><ActivityIndicator size="large" color={tTheme.accent} /></View>;
    }

    return (
        <View style={[styles.container, { backgroundColor: tTheme.background }]}>
            <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: tTheme.accent }]} 
                onPress={() => navigation.navigate('CreateInvoice')}
            >
                <Ionicons name="add-circle-outline" size={22} color="#fff" />
                <Text style={styles.createButtonText}>{tStrings.createInvoice}</Text>
            </TouchableOpacity>

            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.item, { backgroundColor: tTheme.card, borderBottomColor: tTheme.background }]}
                        onPress={() => navigation.navigate('InvoiceDetail', { invoice_id: item.id })}
                    >
                        <View style={styles.itemHeader}>
                           <Text style={[styles.title, { color: tTheme.text }]}>{item.invoice_number}</Text>
                           <Text style={[styles.date, { color: tTheme.text }]}>{new Date(item.issue_date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.client, { color: tTheme.text }]}>{item.clients?.name}</Text>
                        <View style={styles.itemFooter}>
                            <Text style={[styles.amount, { color: tTheme.accent }]}>{item.total_amount?.toFixed(2) || '0.00'} TND</Text>
                            <Text style={getStatusStyle(item.status)}>{item.status.replace('_', ' ')}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ color: tTheme.text, textAlign: 'center', marginTop: 20 }}>No invoices found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, paddingHorizontal: 10, paddingTop: 10 },
    createButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 12, 
        borderRadius: 30, 
        marginHorizontal: 20, 
        marginBottom: 10,
        elevation: 3,
    },
    createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    item: { 
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    title: { 
        fontSize: 16, 
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
    },
    client: {
        fontSize: 14,
        marginBottom: 10,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});