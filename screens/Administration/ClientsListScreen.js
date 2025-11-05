import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ModernActionButton,
    ModernSearchBar,
    ModernTable,
} from '../../components/ModernUIComponents';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

export default function ClientsListScreen() {
  // --- Hooks ---
  const navigation = useNavigation();
  const { theme, language } = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Styles & Translations ---
  const styles = getGlobalStyles(theme);
  const tTheme = themes[theme];
  const t = translations[language];

  // --- Data Fetching ---
  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      setClients(data || []);
      setFilteredClients(data || []);
    }
    setLoading(false);
  }, [t.error]);

  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [fetchClients])
  );

  // Set header button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={[localStyles.headerButton, { backgroundColor: tTheme.primarySoft }]}
          onPress={() => navigation.navigate('CreateClient')}
        >
          <Ionicons name="add" size={20} color={tTheme.primary} />
          <Text style={[localStyles.headerButtonText, { color: tTheme.primary }]}>Nouveau</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }, [fetchClients]);

  // Filter clients based on search
  React.useEffect(() => {
    if (searchQuery) {
      setFilteredClients(
        clients.filter(
          (client) =>
            client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.phone?.includes(searchQuery) ||
            client.matricule_fiscale?.includes(searchQuery)
        )
      );
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  // --- Handlers ---
  const handleClientPress = (client) => {
    setSelectedClient({ ...client });
    setIsModalVisible(true);
  };

  const handleModalInputChange = (field, value) => {
    setSelectedClient(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateClient = async () => {
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
        Alert.alert(t.success, t.clientUpdated);
        setIsModalVisible(false);
        fetchClients();
    }
    setIsSaving(false);
  };

  const confirmDeleteClient = () => {
    Alert.alert(
        t.confirmDelete,
        `${t.areYouSure} "${selectedClient?.name}" ?`,
        [
            { text: t.cancel, style: 'cancel' },
            { text: t.delete, style: 'destructive', onPress: () => handleDeleteClient() }
        ]
    );
  };

  const handleDeleteClient = async () => {
    setIsSaving(true);
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);
    
    if (error) {
        Alert.alert(t.error, error.message);
    } else {
        Alert.alert(t.success, t.clientDeleted);
        setIsModalVisible(false);
        fetchClients();
    }
    setIsSaving(false);
  };

  // Table columns configuration
  const tableColumns = [
    {
      key: 'name',
      label: 'Nom',
      flex: 1.5,
      render: (row) => (
        <View>
          <Text style={[localStyles.clientName, { color: tTheme.text }]} numberOfLines={1}>
            {row.name}
          </Text>
          {row.matricule_fiscale && (
            <Text style={[localStyles.clientSubtext, { color: tTheme.textSecondary }]} numberOfLines={1}>
              MF: {row.matricule_fiscale}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      flex: 1.5,
      render: (row) => (
        <View>
          {row.email && (
            <Text style={[localStyles.clientSubtext, { color: tTheme.text }]} numberOfLines={1}>
              {row.email}
            </Text>
          )}
          {row.phone && (
            <Text style={[localStyles.clientSubtext, { color: tTheme.textSecondary }]} numberOfLines={1}>
              {row.phone}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'address',
      label: 'Adresse',
      flex: 1.5,
      render: (row) => (
        <Text style={{ color: tTheme.textSecondary }} numberOfLines={2}>
          {row.address || 'Aucune adresse'}
        </Text>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      flex: 1,
      render: (row) => (
        <View style={localStyles.actionsContainer}>
          <ModernActionButton
            icon="create-outline"
            onPress={() => handleClientPress(row)}
            theme={theme}
            variant="secondary"
            compact
          />
          <ModernActionButton
            icon="trash-outline"
            onPress={() => {
              setSelectedClient(row);
              confirmDeleteClient();
            }}
            theme={theme}
            variant="danger"
            compact
          />
        </View>
      ),
    },
  ];

  // --- Render ---
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
        }
      >
        {/* Search Bar */}
        <View style={localStyles.searchContainer}>
          <ModernSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher (nom, email, téléphone, MF)..."
            theme={theme}
          />
        </View>

        {/* Modern Table */}
        <View style={localStyles.tableWrapper}>
          <ModernTable
            data={filteredClients}
            columns={tableColumns}
            onRowPress={handleClientPress}
            theme={theme}
            loading={loading}
            emptyMessage="Aucun client trouvé. Créez votre premier client."
          />
        </View>
      </ScrollView>

      {/* Modal for Editing Client */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={[localStyles.modalContent, {backgroundColor: tTheme.card, borderColor: tTheme.border}]}>
            <View style={[localStyles.modalHeader, {borderBottomColor: tTheme.border}]}>
              <Text style={[localStyles.modalTitle, {color: tTheme.text}]}>{t.edit} Client</Text>
              <ModernActionButton
                icon="close"
                onPress={() => setIsModalVisible(false)}
                theme={theme}
                variant="secondary"
                compact
              />
            </View>

            <ScrollView style={localStyles.modalBody}>
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
            </ScrollView>
            
            <View style={[localStyles.modalFooter, {borderTopColor: tTheme.border}]}>
              <ModernActionButton
                label={t.delete}
                onPress={confirmDeleteClient}
                theme={theme}
                variant="danger"
                disabled={isSaving}
              />
              <ModernActionButton
                label={isSaving ? t.saving : t.save}
                onPress={handleUpdateClient}
                theme={theme}
                variant="primary"
                disabled={isSaving}
              />
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
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  tableWrapper: {
    marginBottom: 20,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  clientSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
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
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
    justifyContent: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
  },
});