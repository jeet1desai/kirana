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
  DUMMY_CLEARED: "@kirana_dummy_cleared_v1",
};

const LEGACY_DUMMY_IDS = new Set([
  "prod_1",
  "prod_2",
  "prod_3",
  "prod_4",
  "prod_5",
  "prod_6",
  "prod_7",
  "prod_8",
  "prod_9",
  "prod_10",
  "prod_11",
  "prod_12",
  "prod_13",
  "prod_14",
]);

export async function purgeLegacyDummyDataOnce(): Promise<void> {
  try {
    const isCleared = await AsyncStorage.getItem(KEYS.DUMMY_CLEARED);
    if (!isCleared) {
      await AsyncStorage.removeItem(KEYS.PRODUCTS);
      await AsyncStorage.removeItem(KEYS.PRICE_HISTORY);
      await AsyncStorage.removeItem(KEYS.ACTIVITY_LOGS);
      await AsyncStorage.setItem(KEYS.DUMMY_CLEARED, "true");
    }
  } catch (err) {
    console.warn("Failed to purge legacy dummy data:", err);
  }
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
    if (raw) {
      const parsed: Product[] = JSON.parse(raw);
      const cleaned = parsed.filter((p) => !LEGACY_DUMMY_IDS.has(p.id));
      if (cleaned.length !== parsed.length) {
        await saveProducts(cleaned);
      }
      return cleaned;
    }
  } catch (err) {
    console.warn("Error loading products from storage:", err);
  }
  return [];
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
      const parsed: PriceHistory[] = JSON.parse(raw);
      const cleaned = parsed.filter(
        (h) => !["hist_1", "hist_2", "hist_3", "hist_4"].includes(h.id),
      );
      return cleaned;
    }
  } catch (err) {
    console.warn("Error loading price history from storage:", err);
  }
  return [];
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
      const parsed: ActivityLog[] = JSON.parse(raw);
      const cleaned = parsed.filter(
        (l) => !["act_1", "act_2", "act_3", "act_4", "act_5"].includes(l.id),
      );
      return cleaned;
    }
  } catch (err) {
    console.warn("Error loading activity logs from storage:", err);
  }
  return [];
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
  await saveProducts([]);
  await savePriceHistory([]);
  await saveActivityLogs([]);
  return {
    products: [],
    priceHistory: [],
    activityLogs: [],
  };
}

export async function clearAllLocalData(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PRODUCTS);
  await AsyncStorage.removeItem(KEYS.PRICE_HISTORY);
  await AsyncStorage.removeItem(KEYS.ACTIVITY_LOGS);
}
