import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { translations } from '../../constants/AppConfig';
import { useAuth } from '../../context/AuthContext';
import StockMovementsScreen from '../../screens/Stock/StockMovementsScreen';
import StockScreen from '../../screens/Stock/StockScreen';
import { getStackScreenOptions } from '../navigationConfig';

const Stack = createNativeStackNavigator();

export default function StockStack() {
    const { theme, language } = useAuth();
    const t = translations[language];

    return (
        <Stack.Navigator
            screenOptions={getStackScreenOptions(theme)}
        >
            <Stack.Screen 
                name="StockList" 
                component={StockScreen} 
                options={{ title: t.stock || 'Gestion de Stock' }} 
            />
            <Stack.Screen 
                name="StockMovements" 
                component={StockMovementsScreen} 
                options={{ title: t.stockMovements || 'Mouvements de Stock' }} 
            />
        </Stack.Navigator>
    );
}
