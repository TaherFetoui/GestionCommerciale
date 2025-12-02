import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
    const [logoUri, setLogoUri] = useState(null);

    const fetchCompanyInfo = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.from('company_info').select('*').eq('user_id', user.id).single();
        if (data) {
            setCompany(data);
            if (data.logo_url) {
                setLogoUri(data.logo_url);
            }
        }
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
        setLogoUri(company.logo_url || null);
    };

    const handleChange = (field, value) => {
        setDraftCompany(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos.');
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setLogoUri(uri);
            handleChange('logo_url', uri);
        }
    };

    const removeLogo = () => {
        setLogoUri(null);
        handleChange('logo_url', null);
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
            Alert.alert(t.success, t.infoSaved);
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
            
            {/* Logo Section */}
            <InfoSection
                title="Logo de l'entreprise"
                theme={theme}
                isEditing={editingSection === 'logo'}
                onEdit={() => handleEdit('logo')}
                onCancel={handleCancel}
                onSave={promptSave}
            >
                {editingSection === 'logo' ? (
                    <View style={localStyles.logoEditContainer}>
                        {logoUri ? (
                            <View style={localStyles.logoPreviewContainer}>
                                <Image 
                                    source={{ uri: logoUri }} 
                                    style={localStyles.logoPreview}
                                    resizeMode="contain"
                                />
                                <View style={localStyles.logoActions}>
                                    <TouchableOpacity 
                                        style={[localStyles.logoButton, { backgroundColor: tTheme.primary }]}
                                        onPress={pickImage}
                                    >
                                        <Ionicons name="image-outline" size={20} color="#FFF" />
                                        <Text style={localStyles.logoButtonText}>Changer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[localStyles.logoButton, { backgroundColor: tTheme.danger }]}
                                        onPress={removeLogo}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FFF" />
                                        <Text style={localStyles.logoButtonText}>Supprimer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[localStyles.logoUploadBox, { borderColor: tTheme.border, backgroundColor: tTheme.background }]}
                                onPress={pickImage}
                            >
                                <Ionicons name="cloud-upload-outline" size={48} color={tTheme.textSecondary} />
                                <Text style={[localStyles.uploadText, { color: tTheme.text }]}>
                                    Ajouter un logo
                                </Text>
                                <Text style={[localStyles.uploadSubtext, { color: tTheme.textSecondary }]}>
                                    Format recommandé: PNG, JPG (carré)
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={localStyles.logoDisplayContainer}>
                        {company.logo_url ? (
                            <Image 
                                source={{ uri: company.logo_url }} 
                                style={localStyles.logoDisplay}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={[localStyles.noLogoBox, { backgroundColor: tTheme.background }]}>
                                <Ionicons name="business-outline" size={40} color={tTheme.textSecondary} />
                                <Text style={[localStyles.noLogoText, { color: tTheme.textSecondary }]}>
                                    Aucun logo
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </InfoSection>
            
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
    
    // Logo styles
    logoEditContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    logoPreviewContainer: {
        alignItems: 'center',
        width: '100%',
    },
    logoPreview: {
        width: 150,
        height: 150,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    logoActions: {
        flexDirection: 'row',
        gap: 12,
    },
    logoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    logoButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    logoUploadBox: {
        width: '100%',
        padding: 40,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
    },
    uploadSubtext: {
        fontSize: 13,
        marginTop: 4,
    },
    logoDisplayContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    logoDisplay: {
        width: 120,
        height: 120,
        borderRadius: 12,
    },
    noLogoBox: {
        width: 120,
        height: 120,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noLogoText: {
        fontSize: 13,
        marginTop: 8,
    },
    
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', },
    modalContent: { width: '90%', maxWidth: 400, borderRadius: 16, padding: 24, alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    modalSubText: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
    modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8 },
});