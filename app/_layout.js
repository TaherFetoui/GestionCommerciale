import { AuthProvider } from '../context/AuthContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  // The AuthProvider now wraps the entire app,
  // and <Slot /> renders the current page (like index.js).
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}