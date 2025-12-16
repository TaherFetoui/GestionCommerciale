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
    ModernFilterChip,
    ModernSearchBar,
    ModernStatusBadge,
    ModernTable,
} from '../../components/ModernUIComponents';
import Toast from '../../components/Toast';
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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
      setToast({ visible: true, message: error.message, type: 'error' });
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

  // Filter clients based on search and type
  React.useEffect(() => {
    let result = clients;

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone?.includes(searchQuery) ||
          client.matricule_fiscale?.includes(searchQuery)
      );
    }

    // Filter by client type
    if (typeFilter !== 'all') {
      result = result.filter(client => client.type_client === typeFilter);
    }

    setFilteredClients(result);
  }, [searchQuery, typeFilter, clients]);

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
        setToast({ visible: true, message: t.requiredField, type: 'warning' });
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
        setToast({ visible: true, message: error.message, type: 'error' });
    } else {
        setToast({ visible: true, message: t.clientUpdated, type: 'success' });
        setIsModalVisible(false);
        fetchClients();
    }
    setIsSaving(false);
  };

  const confirmDeleteClient = useCallback(async () => {
    if (!clientToDelete) return;
    
    setDeleteModalVisible(false);
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) {
        setToast({ visible: true, message: error.message, type: 'error' });
      } else {
        setClients(prev => prev.filter(client => client.id !== clientToDelete.id));
        setToast({ visible: true, message: 'Client supprimé avec succès', type: 'success' });
      }
    } catch (error) {
      setToast({ visible: true, message: 'Impossible de supprimer le client', type: 'error' });
    }
    
    setClientToDelete(null);
  }, [clientToDelete, t.error]);

  const cancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setClientToDelete(null);
  }, []);

  // Table columns configuration
  const tableColumns = [
    {
      key: 'name',
      label: 'Nom',
      flex: 1.5,
      render: (row) => (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[localStyles.clientName, { color: tTheme.text }]} numberOfLines={1}>
              {row.name}
            </Text>
            {row.type_client && (
              <ModernStatusBadge 
                label={row.type_client === 'entreprise' ? 'Entreprise' : 'Particulier'} 
                variant={row.type_client === 'entreprise' ? 'info' : 'default'}
              />
            )}
          </View>
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
          <TouchableOpacity
            style={[localStyles.actionButton, { backgroundColor: tTheme.primary + '15' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleClientPress(row);
            }}
          >
            <Ionicons name="create-outline" size={18} color={tTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[localStyles.deleteButton, { 
              backgroundColor: '#FEE2E2',
              borderColor: '#EF4444'
            }]}
            onPress={(e) => {
              if (e && e.stopPropagation) {
                e.stopPropagation();
              }
              console.log('Delete button pressed!');
              setClientToDelete(row);
              setDeleteModalVisible(true);
            }}
          >
            <Ionicons name="trash" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'entreprise', label: 'Entreprises' },
    { value: 'particulier', label: 'Particuliers' },
  ];

  // --- Render ---
  return (
    <View style={[styles.container, { backgroundColor: tTheme.background }]}>
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[tTheme.primary]} />
        }
      >
        {/* Search and Filters */}
        <View style={localStyles.filtersContainer}>
          <ModernSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher (nom, email, téléphone, MF)..."
            theme={theme}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filterChipsContainer}>
            {filterOptions.map((filter) => (
              <ModernFilterChip
                key={filter.value}
                label={filter.label}
                active={typeFilter === filter.value}
                onPress={() => setTypeFilter(filter.value)}
                theme={theme}
              />
            ))}
          </ScrollView>
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={localStyles.modalOverlay}>
          <View style={[localStyles.deleteModalContainer, { backgroundColor: tTheme.card }]}>
            {/* Icon */}
            <View style={[localStyles.modalIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="warning" size={48} color="#DC2626" />
            </View>

            {/* Title */}
            <Text style={[localStyles.deleteModalTitle, { color: tTheme.text }]}>
              Supprimer le client
            </Text>

            {/* Message */}
            <Text style={[localStyles.modalMessage, { color: tTheme.textSecondary }]}>
              Voulez-vous vraiment supprimer le client{'\n'}
              <Text style={{ fontWeight: 'bold', color: tTheme.primary }}>
                {clientToDelete?.name}
              </Text>
              {'\n\n'}
              <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                Cette action est irréversible.
              </Text>
            </Text>

            {/* Buttons */}
            <View style={localStyles.modalButtons}>
              <TouchableOpacity
                style={[localStyles.modalButton, localStyles.cancelButton, { backgroundColor: tTheme.border }]}
                onPress={cancelDelete}
                activeOpacity={0.7}
              >
                <Text style={[localStyles.modalButtonText, { color: tTheme.text }]}>
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[localStyles.modalButton, { backgroundColor: '#DC2626' }]}
                onPress={confirmDeleteClient}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={[localStyles.modalButtonText, { color: '#FFFFFF', marginLeft: 6 }]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        theme={theme}
        onHide={() => setToast({ ...toast, visible: false })}
      />
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
  filtersContainer: {
    marginBottom: 20,
  },
  filterChipsContainer: {
    marginTop: 12,
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
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});