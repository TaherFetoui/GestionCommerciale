import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://dhtyyhwoyciribwdhplz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodHl5aHdveWNpcmlid2RocGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTU3OTEsImV4cCI6MjA2ODQ5MTc5MX0.JyHed0Ttr4gLNJSTyzWc_8KO-xVz6lcySpYM3SgZD4Y';

// Configure Supabase client with AsyncStorage for token persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});