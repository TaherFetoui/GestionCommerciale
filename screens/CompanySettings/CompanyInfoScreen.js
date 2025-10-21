import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { themes, translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getGlobalStyles } from '../../styles/GlobalStyles';

// A reusable component for each section of information
const InfoSection = ({ title, children, onEdit, isEditing, onSave, onCancel, theme }) => {
    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    return (
        <View style={styles.card}>
            <View style={localStyles.sectionHeader}>
                <Text style={[localStyles.sectionTitle, { color: tTheme.text }]}>{title}</Text>
                {!isEditing && (
                    <TouchableOpacity onPress={onEdit}>
                        <Ionicons name="pencil" size={20} color={tTheme.primary} />
                    </TouchableOpacity>
                )}
            </View>
            <View style={localStyles.sectionContent}>
                {children}
            </View>
            {isEditing && (
                <View style={localStyles.buttonRow}>
                    <TouchableOpacity style={[localStyles.actionButton, { backgroundColor: tTheme.secondary }]} onPress={onCancel}>
                        <Text style={[localStyles.actionButtonText, { color: tTheme.text }]}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[localStyles.actionButton, { backgroundColor: tTheme.primary }]} onPress={onSave}>
                        <Text style={[localStyles.actionButtonText, { color: tTheme.buttonText }]}>Sauvegarder</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default function CompanyInfoScreen() {
    const { user, theme, language } = useAuth();
    const styles = getGlobalStyles(theme);
    const tTheme = themes[theme];
    const t = translations[language];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState({});
    const [draftCompany, setDraftCompany] = useState(null);
    const [editingSection, setEditingSection] = useState(null);
    const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);

    const fetchCompanyInfo = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.from('company_info').select('*').eq('user_id', user.id).single();
        if (data) setCompany(data);
        setLoading(false);
    }, [user]);

    useFocusEffect(fetchCompanyInfo);

    const handleEdit = (section) => {
        setEditingSection(section);
        setDraftCompany({ ...company });
    };

    const handleCancel = () => {
        setEditingSection(null);
        setDraftCompany(null);
    };

    const handleChange = (field, value) => {
        setDraftCompany(prev => ({ ...prev, [field]: value }));
    };

    const promptSave = () => {
        setConfirmModalVisible(true);
    };

    const handleConfirmSave = async () => {
        setConfirmModalVisible(false);
        setSaving(true);
        const { error } = await supabase.from('company_info').upsert({ ...draftCompany, user_id: user.id }, { onConflict: 'user_id' });
        
        if (error) {
            Alert.alert(t.error, error.message);
        } else {
            Alert.alert(t.success, 'Informations enregistrées.');
            setCompany({ ...draftCompany }); // Update main state
            handleCancel();
            fetchCompanyInfo(); // Re-fetch for consistency
        }
        setSaving(false);
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={tTheme.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={localStyles.scrollContent}>
            <InfoSection
                title="Informations Générales"
                theme={theme}
                isEditing={editingSection === 'general'}
                onEdit={() => handleEdit('general')}
                onCancel={handleCancel}
                onSave={promptSave}
            >
                {editingSection === 'general' ? (
                    <>
                        <Text style={styles.label}>{t.raisonSociale}</Text>
                        <TextInput style={styles.input} value={draftCompany.name} onChangeText={(val) => handleChange('name', val)} />
                        <Text style={styles.label}>{t.matriculeFiscale}</Text>
                        <TextInput style={styles.input} value={draftCompany.tax_id} onChangeText={(val) => handleChange('tax_id', val)} />
                    </>
                ) : (
                    <>
                        <Text style={localStyles.infoLabel}>{t.raisonSociale}</Text>
                        <Text style={[localStyles.infoText, {color: tTheme.text}]}>{company.name || '-'}</Text>
                        <Text style={localStyles.infoLabel}>{t.matriculeFiscale}</Text>
                        <Text style={[localStyles.infoText, {color: tTheme.text}]}>{company.tax_id || '-'}</Text>
                    </>
                )}
            </InfoSection>

            <InfoSection
                title="Coordonnées"
                theme={theme}
                isEditing={editingSection === 'contact'}
                onEdit={() => handleEdit('contact')}
                onCancel={handleCancel}
                onSave={promptSave}
            >
                {editingSection === 'contact' ? (
                     <>
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={draftCompany.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address"/>
                        <Text style={styles.label}>Téléphone</Text>
                        <TextInput style={styles.input} value={draftCompany.phone} onChangeText={(val) => handleChange('phone', val)} keyboardType="phone-pad" />
                    </>
                ) : (
                    <>
                        <Text style={localStyles.infoLabel}>Email</Text>
                        <Text style={[localStyles.infoText, {color: tTheme.text}]}>{company.email || '-'}</Text>
                        <Text style={localStyles.infoLabel}>Téléphone</Text>
                        <Text style={[localStyles.infoText, {color: tTheme.text}]}>{company.phone || '-'}</Text>
                    </>
                )}
            </InfoSection>
            
            {/* Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isConfirmModalVisible}
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View style={localStyles.modalContainer}>
                    <View style={[localStyles.modalContent, {backgroundColor: tTheme.card}]}>
                        <Ionicons name="checkmark-circle-outline" size={50} color={tTheme.success} />
                        <Text style={[localStyles.modalTitle, {color: tTheme.text}]}>Confirmer les changements ?</Text>
                        <Text style={[localStyles.modalSubText, {color: tTheme.textSecondary}]}>Voulez-vous vraiment enregistrer ces modifications ?</Text>
                        <View style={localStyles.modalButtonRow}>
                            <TouchableOpacity style={[localStyles.modalButton, {backgroundColor: tTheme.secondary}]} onPress={() => setConfirmModalVisible(false)}>
                                <Text style={{color: tTheme.text, fontWeight: 'bold'}}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[localStyles.modalButton, {backgroundColor: tTheme.primary}]} onPress={handleConfirmSave} disabled={saving}>
                                <Text style={{color: tTheme.buttonText, fontWeight: 'bold'}}>{saving ? t.saving : 'Confirmer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    scrollContent: {
        padding: 20,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', },
    sectionContent: { marginBottom: 16, },
    infoLabel: { fontSize: 14, color: '#6B7A99', marginBottom: 4 },
    infoText: { fontSize: 16, fontWeight: '500', marginBottom: 12, },
    buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', },
    actionButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 12, },
    actionButtonText: { fontWeight: 'bold' },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', },
    modalContent: { width: '90%', maxWidth: 400, borderRadius: 16, padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    modalSubText: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
});