import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhtyyhwoyciribwdhplz.supabase.co'; // Remplacez par votre URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodHl5aHdveWNpcmlid2RocGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTU3OTEsImV4cCI6MjA2ODQ5MTc5MX0.JyHed0Ttr4gLNJSTyzWc_8KO-xVz6lcySpYM3SgZD4Y'; // Remplacez par votre clé anon

export const supabase = createClient(supabaseUrl, supabaseAnonKey);