import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import BankAccountsScreen from '../../screens/Finance/BankAccountsScreen';
import CashSessionScreen from '../../screens/Finance/CashSessionScreen';
import ChecksScreen from '../../screens/Finance/ChecksScreen';
import ClientFiscalYearScreen from '../../screens/Finance/ClientFiscalYearScreen';
import ClientPaymentOrdersScreen from '../../screens/Finance/ClientPaymentOrdersScreen';
import ClientReturnsScreen from '../../screens/Finance/ClientReturnsScreen';
import FinanceScreen from '../../screens/Finance/FinanceScreen';
import PaymentSlipsScreen from '../../screens/Finance/PaymentSlipsScreen';
import SupplierFiscalYearScreen from '../../screens/Finance/SupplierFiscalYearScreen';
import SupplierPaymentOrdersScreen from '../../screens/Finance/SupplierPaymentOrdersScreen';
import SupplierReturnsScreen from '../../screens/Finance/SupplierReturnsScreen';
import { getStackScreenOptions } from '../navigationConfig';

const Stack = createNativeStackNavigator();

export default function FinanceStack() {
    const { theme, language } = useAuth();
    const t = translations[language];

    return (
        <Stack.Navigator
            screenOptions={getStackScreenOptions(theme)}
        >
            <Stack.Screen 
                name="FinanceOverview" 
                component={FinanceScreen} 
                options={{ title: t.finance || 'Finance' }} 
            />
            <Stack.Screen 
                name="SupplierReturns" 
                component={SupplierReturnsScreen} 
                options={{ title: t.supplierReturns || 'Retenues à la source fournisseurs' }} 
            />
            <Stack.Screen 
                name="ClientReturns" 
                component={ClientReturnsScreen} 
                options={{ title: t.clientReturns || 'Retenues à la source clients' }} 
            />
            <Stack.Screen 
                name="SupplierPaymentOrders" 
                component={SupplierPaymentOrdersScreen} 
                options={{ title: t.supplierPaymentOrders || 'Ordres de paiement fournisseurs' }} 
            />
            <Stack.Screen 
                name="ClientPaymentOrders" 
                component={ClientPaymentOrdersScreen} 
                options={{ title: t.clientPaymentOrders || 'Ordres de paiement clients' }} 
            />
            <Stack.Screen 
                name="PaymentSlips" 
                component={PaymentSlipsScreen} 
                options={{ title: t.paymentSlips || 'Bordereaux de versement' }} 
            />
            <Stack.Screen 
                name="BankAccounts" 
                component={BankAccountsScreen} 
                options={{ title: t.bankAccounts || 'Agences bancaires\\caisses' }} 
            />
            <Stack.Screen 
                name="SupplierFiscalYear" 
                component={SupplierFiscalYearScreen} 
                options={{ title: t.supplierFiscalYear || 'Début exercice fournisseur' }} 
            />
            <Stack.Screen 
                name="ClientFiscalYear" 
                component={ClientFiscalYearScreen} 
                options={{ title: t.clientFiscalYear || 'Début exercice client' }} 
            />
            <Stack.Screen 
                name="CashSession" 
                component={CashSessionScreen} 
                options={{ title: t.cashSession || 'Session de caisse' }} 
            />
            <Stack.Screen 
                name="Checks" 
                component={ChecksScreen} 
                options={{ title: t.checks || 'Chèques' }} 
            />
        </Stack.Navigator>
    );
}
