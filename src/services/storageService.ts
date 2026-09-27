import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, PriceHistory, ActivityLog, UserProfile } from "../types";
import {
  INITIAL_PRODUCTS,
  INITIAL_PRICE_HISTORY,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_USERS,
} from "./mockData";

const KEYS = {
  PRODUCTS: "@kirana_products_v1",
  PRICE_HISTORY: "@kirana_price_history_v1",
  ACTIVITY_LOGS: "@kirana_activity_logs_v1",
  ACTIVE_USER: "@kirana_active_user_v1",
  ALL_USERS: "@kirana_all_users_v1",
};

export async function loadProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      return parsed.map((p) => {
        if (!p.variants || p.variants.length === 0) {
          const mockMatch = INITIAL_PRODUCTS.find((m) => m.id === p.id);
          if (mockMatch?.variants && mockMatch.variants.length > 0) {
            return { ...p, variants: mockMatch.variants };
          }
        }
        return p;
      });
    }
  } catch (err) {
    console.warn("Error loading products from storage:", err);
  }
  // Initialize with default seed data
  await saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

export async function saveProducts(products: Product[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.warn("Error saving products to storage:", err);
  }
}

export async function loadPriceHistory(): Promise<PriceHistory[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRICE_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error loading price history from storage:", err);
  }
  await savePriceHistory(INITIAL_PRICE_HISTORY);
  return INITIAL_PRICE_HISTORY;
}

export async function savePriceHistory(history: PriceHistory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PRICE_HISTORY, JSON.stringify(history));
  } catch (err) {
    console.warn("Error saving price history to storage:", err);
  }
}

export async function loadActivityLogs(): Promise<ActivityLog[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVITY_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error loading activity logs from storage:", err);
  }
  await saveActivityLogs(INITIAL_ACTIVITY_LOGS);
  return INITIAL_ACTIVITY_LOGS;
}

export async function saveActivityLogs(logs: ActivityLog[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.warn("Error saving activity logs to storage:", err);
  }
}

export async function loadUsers(): Promise<UserProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ALL_USERS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error loading users from storage:", err);
  }
  await saveUsers(INITIAL_USERS);
  return INITIAL_USERS;
}

export async function saveUsers(users: UserProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ALL_USERS, JSON.stringify(users));
  } catch (err) {
    console.warn("Error saving users to storage:", err);
  }
}

export async function loadActiveUser(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error loading active user from storage:", err);
  }
  await saveActiveUser(INITIAL_USERS[0]);
  return INITIAL_USERS[0];
}

export async function saveActiveUser(user: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(user));
  } catch (err) {
    console.warn("Error saving active user to storage:", err);
  }
}

export async function resetToDefaultData(): Promise<{
  products: Product[];
  priceHistory: PriceHistory[];
  activityLogs: ActivityLog[];
}> {
  await saveProducts(INITIAL_PRODUCTS);
  await savePriceHistory(INITIAL_PRICE_HISTORY);
  await saveActivityLogs(INITIAL_ACTIVITY_LOGS);
  return {
    products: INITIAL_PRODUCTS,
    priceHistory: INITIAL_PRICE_HISTORY,
    activityLogs: INITIAL_ACTIVITY_LOGS,
  };
}
