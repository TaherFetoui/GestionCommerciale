import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

// --- NATIVE-ONLY IMPORTS ---
// We only import these if we are NOT on the web
let generateInvoiceHtml, RNHTMLtoPDF, RNPrint, Share;
if (Platform.OS !== 'web') {
    generateInvoiceHtml = require('../../services/pdfGenerator').generateInvoiceHtml;
    RNHTMLtoPDF = require('react-native-html-to-pdf').default;
    RNPrint = require('react-native-print').default;
    Share = require('react-native-share').default;
}

export default function InvoiceDetailScreen({ route }) {
    const { invoice_id } = route.params;
    const [invoice, setInvoice] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select(`*, clients (*)`)
                .eq('id', invoice_id)
                .single();

            if (error) {
                Alert.alert('Error', 'Failed to fetch invoice details.');
                console.error(error);
            } else {
                setInvoice(data);
                setClient(data.clients);
            }
            setLoading(false);
        };

        fetchInvoiceDetails();
    }, [invoice_id]);

    // --- PLATFORM-AWARE FUNCTIONS ---

    const createPDF = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Feature Not Available', 'PDF generation is only available on the mobile app.');
            return null;
        }
        if (!invoice || !client) return null;

        const html = generateInvoiceHtml(invoice, client);
        try {
            const { filePath } = await RNHTMLtoPDF.convert({
                html,
                fileName: `Invoice_${invoice.invoice_number}`,
                directory: 'Documents',
            });
            return filePath;
        } catch (error) {
            Alert.alert('Error', 'Failed to create PDF.');
            console.error(error);
            return null;
        }
    };

    const handlePrint = async () => {
        if (Platform.OS === 'web') {
            window.print(); // Use the browser's built-in print function
            return;
        }
        const filePath = await createPDF();
        if (filePath) {
            await RNPrint.print({ filePath });
        }
    };

    const handleDownload = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Feature Not Available', 'Sharing is only available on the mobile app.');
            return;
        }
        const filePath = await createPDF();
        if (filePath) {
            try {
                await Share.open({
                    url: `file://${filePath}`,
                    type: 'application/pdf',
                    title: 'Download Invoice'
                });
            } catch (error) {
                if (error.message !== "User did not share") {
                    Alert.alert('Error', 'Could not share the file.');
                }
            }
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (!invoice) {
        return <View style={styles.centered}><Text>Invoice not found.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Invoice: {invoice.invoice_number}</Text>
            <Text>Client: {client?.name}</Text>
            <Text>Total Amount: {invoice.total_amount ? invoice.total_amount.toFixed(3) : '0.000'} TND</Text>
            <Text>Status: {invoice.status}</Text>
            
            <View style={styles.buttonContainer}>
                <Button title="Print / Download Invoice" onPress={handlePrint} />
                {Platform.OS !== 'web' && (
                  <View style={{ marginVertical: 5 }}/>
                )}
                {Platform.OS !== 'web' && (
                  <Button title="Share" onPress={handleDownload} />
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flex: 1, padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    buttonContainer: { marginTop: 30 }
});