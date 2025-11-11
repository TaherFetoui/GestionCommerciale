import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { ReportingProvider } from './context/ReportingContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <ReportingProvider>
          <AppNavigator />
        </ReportingProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}