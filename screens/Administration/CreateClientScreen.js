import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import {
    FormActions,
    FormCard,
    FormColumn,
    FormInput,
    FormRow,
    FormSecondaryButton,
    FormSubmitButton,
    ModernFormModal
} from '../../components/ModernForm';
import Toast from '../../components/Toast';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
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
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const styles = getGlobalStyles(theme);
    const t = translations[language];

    const handleSaveClient = async () => {
        if (!name) {
            setToast({
                visible: true,
                message: `${t.raisonSociale} ${t.requiredField}`,
                type: 'error',
            });
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
            setToast({
                visible: true,
                message: error.message,
                type: 'error',
            });
        } else {
            setToast({
                visible: true,
                message: 'Client ajouté avec succès!',
                type: 'success',
            });
            setTimeout(() => navigation.goBack(), 1500);
        }
        setLoading(false);
    };

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                theme={theme}
                onHide={() => setToast({ ...toast, visible: false })}
            />
            <ModernFormModal
                visible={true}
                onClose={() => navigation.goBack()}
                title={t.createClient}
                theme={theme}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FormCard title="Informations personnelles" icon="person" theme={theme}>
                        <FormInput
                            label={t.raisonSociale}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nom de l'entreprise"
                            icon="business"
                            required
                            theme={theme}
                        />

                        <FormInput
                            label={t.matriculeFiscale}
                            value={taxId}
                            onChangeText={setTaxId}
                            placeholder="Matricule fiscale"
                            icon="card"
                            theme={theme}
                        />
                    </FormCard>

                    <FormCard title="Coordonnées" icon="call" theme={theme}>
                        <FormRow>
                            <FormColumn>
                                <FormInput
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="email@exemple.com"
                                    icon="mail"
                                    keyboardType="email-address"
                                    theme={theme}
                                />
                            </FormColumn>
                            <FormColumn>
                                <FormInput
                                    label="Téléphone"
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="+216 XX XXX XXX"
                                    icon="call"
                                    keyboardType="phone-pad"
                                    theme={theme}
                                />
                            </FormColumn>
                        </FormRow>

                        <FormInput
                            label={t.address}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Adresse complète"
                            icon="location"
                            multiline
                            theme={theme}
                        />
                    </FormCard>

                    <FormActions>
                        <FormSecondaryButton
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                            theme={theme}
                        >
                            Annuler
                        </FormSecondaryButton>
                        <FormSubmitButton
                            onPress={handleSaveClient}
                            loading={loading}
                            theme={theme}
                        >
                            {loading ? t.saving : t.save}
                        </FormSubmitButton>
                    </FormActions>
                </ScrollView>
            </ModernFormModal>
        </>
    );
}