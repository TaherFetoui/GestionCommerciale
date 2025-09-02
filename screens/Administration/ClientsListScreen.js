import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { themes, translations } from '../../constants/AppConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ClientsListScreen() {
  // --- Hooks ---
  const navigation = useNavigation();
  const { theme, language } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Styles & Translations ---
  const styles = getGlobalStyles(theme);
  const tTheme = themes[theme];
  const t = translations[language];

  // --- Data Fetching ---
  const fetchClients = useCallback(async () => {
    // ... (data fetching logic remains the same)
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      setClients(data);
    }
    setLoading(false);
  }, [t.error]);

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [fetchClients])
  );

  // --- Header Button ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
          onPress={() => navigation.navigate('CreateClient')}
        >
          <Ionicons name="add" size={20} color={tTheme.primary} />
          <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>{t.create}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, t]);

  // --- Handlers ---
  const handleClientPress = (client) => {
    setSelectedClient({ ...client });
    setIsModalVisible(true);
  };

  const handleModalInputChange = (field, value) => {
    setSelectedClient(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateClient = async () => {
    // ... (update logic remains the same)
    if (!selectedClient?.name) {
        Alert.alert(t.error, t.requiredField);
        return;
    }
    setIsSaving(true);
    const { error } = await supabase
        .from('clients')
        .update({ 
            name: selectedClient.name,
            matricule_fiscale: selectedClient.matricule_fiscale,
            email: selectedClient.email,
            phone: selectedClient.phone,
            address: selectedClient.address,
         })
        .eq('id', selectedClient.id);

    if (error) {
        Alert.alert(t.error, error.message);
    } else {
        Alert.alert(t.success, "Client mis à jour.");
        setIsModalVisible(false);
        fetchClients();
    }
    setIsSaving(false);
  };

  const confirmDeleteClient = () => {
    Alert.alert(
        "Supprimer le Client",
        `Êtes-vous sûr de vouloir supprimer "${selectedClient?.name}" ? Cette action est irréversible.`,
        [
            { text: t.cancel, style: 'cancel' },
            { text: t.delete, style: 'destructive', onPress: () => handleDeleteClient() }
        ]
    );
  };

  const handleDeleteClient = async () => {
    // ... (delete logic remains the same)
    setIsSaving(true);
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);
    
    if (error) {
        Alert.alert(t.error, error.message);
    } else {
        Alert.alert(t.success, "Client supprimé.");
        setIsModalVisible(false);
        fetchClients();
    }
    setIsSaving(false);
  };


  // --- Render ---
  const renderClientItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { marginHorizontal: 16 }]} onPress={() => handleClientPress(item)}>
      <View style={styles.listItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listItemTitle}>{item.name}</Text>
          <Text style={styles.listItemSubtitle}>
            {item.matricule_fiscale || 'Pas de matricule fiscal'}
          </Text>
          <View style={localStyles.detailsContainer}>
            {item.phone && <View style={localStyles.detailItem}><Ionicons name="call-outline" size={14} color={tTheme.textSecondary} /><Text style={[localStyles.detailText, {color: tTheme.textSecondary}]}>{item.phone}</Text></View>}
            {item.email && <View style={localStyles.detailItem}><Ionicons name="mail-outline" size={14} color={tTheme.textSecondary} /><Text style={[localStyles.detailText, {color: tTheme.textSecondary}]}>{item.email}</Text></View>}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={tTheme.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={tTheme.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClientItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={localStyles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={tTheme.border} />
              <Text style={[localStyles.emptyText, {color: tTheme.textSecondary}]}>Aucun client trouvé.</Text>
              <Text style={[localStyles.emptySubText, {color: tTheme.textSecondary}]}>Créez votre premier client pour commencer.</Text>
            </View>
          }
        />
      )}

      {/* Modal for Editing Client */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={[localStyles.modalContent, {backgroundColor: tTheme.card, borderColor: tTheme.border}]}>
            <ScrollView>
                <View style={[localStyles.modalHeader, {borderBottomColor: tTheme.border}]}>
                    <Text style={[localStyles.modalTitle, {color: tTheme.text}]}>{t.edit} Client</Text>
                    <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                        <Ionicons name="close" size={26} color={tTheme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={{padding: 20}}>
                    {/* Form content remains the same */}
                    <Text style={styles.label}>{t.raisonSociale} *</Text>
                    <TextInput style={styles.input} value={selectedClient?.name} onChangeText={(val) => handleModalInputChange('name', val)} />

                    <Text style={styles.label}>{t.matriculeFiscale}</Text>
                    <TextInput style={styles.input} value={selectedClient?.matricule_fiscale} onChangeText={(val) => handleModalInputChange('matricule_fiscale', val)} />
                    
                    <View style={localStyles.inputRow}>
                        <View style={{flex: 1, marginRight: 8}}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput style={styles.input} value={selectedClient?.email} onChangeText={(val) => handleModalInputChange('email', val)} keyboardType="email-address" autoCapitalize="none" />
                        </View>
                        <View style={{flex: 1, marginLeft: 8}}>
                            <Text style={styles.label}>Téléphone</Text>
                            <TextInput style={styles.input} value={selectedClient?.phone} onChangeText={(val) => handleModalInputChange('phone', val)} keyboardType="phone-pad" />
                        </View>
                    </View>
                    
                    <Text style={styles.label}>{t.address}</Text>
                    <TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} value={selectedClient?.address} onChangeText={(val) => handleModalInputChange('address', val)} multiline />
                </View>
            </ScrollView>
            
            {/* --- UPDATED MODAL FOOTER --- */}
            <View style={[localStyles.modalFooter, {borderTopColor: tTheme.border}]}>
                <TouchableOpacity style={[localStyles.deleteButton, {backgroundColor: tTheme.danger}]} onPress={confirmDeleteClient} disabled={isSaving}>
                    <Text style={[localStyles.deleteButtonText, {color: tTheme.buttonText}]}>{t.delete}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, localStyles.saveButtonModal]} onPress={handleUpdateClient} disabled={isSaving}>
                    <Text style={styles.primaryButtonText}>{isSaving ? t.saving : t.save}</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerButton: {
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  detailsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '30%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
  },
  // --- UPDATED MODAL STYLES ---
  modalContainer: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center',   // Center horizontally
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500, // Max width for larger screens
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center buttons
  },
  inputRow: {
      flexDirection: 'row',
  },
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 16,
  },
  deleteButtonText: {
      fontWeight: 'bold',
      fontSize: 16,
  },
  saveButtonModal: {
      paddingHorizontal: 32,
  }
});