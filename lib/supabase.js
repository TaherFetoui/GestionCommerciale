import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://dhtyyhwoyciribwdhplz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodHl5aHdveWNpcmlid2RocGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTU3OTEsImV4cCI6MjA2ODQ5MTc5MX0.JyHed0Ttr4gLNJSTyzWc_8KO-xVz6lcySpYM3SgZD4Y';

// Custom storage adapter that uses localStorage on web and AsyncStorage on native
const storageAdapter = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Configure Supabase client with proper storage for web and native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});