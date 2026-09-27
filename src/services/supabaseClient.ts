import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_SUPABASE_CONFIG = '@kirana_supabase_config';

let clientInstance: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export async function getSavedSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load Supabase config:', err);
  }
  return null;
}

export async function saveSupabaseConfig(config: SupabaseConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(config));
  currentConfig = config;
  clientInstance = createClient(config.url, config.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export async function clearSupabaseConfig(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_SUPABASE_CONFIG);
  clientInstance = null;
  currentConfig = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  return clientInstance;
}

export async function initSupabaseClient(): Promise<SupabaseClient | null> {
  const config = await getSavedSupabaseConfig();
  if (config) {
    currentConfig = config;
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return clientInstance;
  }
  return null;
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(config.url, config.anonKey);
    const { error } = await testClient.from('products').select('id').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
}
