import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserAccount } from "../types";
import {
  fetchUserFromNeon,
  fetchAllUsersFromNeon,
  upsertUserToNeon,
} from "./neonClient";

const STORAGE_KEY_AUTH_USER = "@kirana_auth_user_v1";
const STORAGE_KEY_ALL_ACCOUNTS = "@kirana_all_accounts_v1";

export async function getStoredUsers(): Promise<UserAccount[]> {
  // 1. Try to fetch from Neon DB
  try {
    const neonUsers = await fetchAllUsersFromNeon();
    if (neonUsers && neonUsers.length > 0) {
      await AsyncStorage.setItem(
        STORAGE_KEY_ALL_ACCOUNTS,
        JSON.stringify(neonUsers),
      );
      return neonUsers;
    }
  } catch (err) {
    console.warn("Error reading users from Neon DB, using local storage:", err);
  }

  // 2. Fall back to local AsyncStorage cache
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ALL_ACCOUNTS);
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw);
      // Filter out legacy demo users if any
      const cleaned = parsed.filter(
        (u) => u.id !== "user_ramesh" && u.id !== "user_suresh",
      );
      return cleaned.map((u) => ({
        ...u,
        pin: u.pin || "1234",
      }));
    }
  } catch (err) {
    console.warn("Error reading stored users from local storage:", err);
  }

  return [];
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      const parsed: UserAccount = JSON.parse(raw);
      if (parsed.id === "user_ramesh" || parsed.id === "user_suresh") {
        // Clear out old demo session
        await AsyncStorage.removeItem(STORAGE_KEY_AUTH_USER);
        return null;
      }
      return parsed;
    }
  } catch (err) {
    console.warn("Error reading current user:", err);
  }
  return null;
}

export async function setCurrentUser(user: UserAccount | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  } catch (err) {
    console.warn("Error setting current user:", err);
  }
}

export async function login(
  emailOrPhone: string,
  passwordOrPin: string,
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  if (!emailOrPhone.trim()) {
    return {
      success: false,
      message: "Please enter your mobile number or email.",
    };
  }
  if (!passwordOrPin || !passwordOrPin.trim()) {
    return {
      success: false,
      message: "Please enter your 4-digit PIN or password.",
    };
  }
  if (passwordOrPin.trim().length < 4) {
    return {
      success: false,
      message: "PIN or password must be at least 4 digits.",
    };
  }

  const normalized = emailOrPhone.trim().toLowerCase();
  const trimmedPin = passwordOrPin.trim();

  // 1. Try querying Neon DB directly
  try {
    const neonUser = await fetchUserFromNeon(normalized);
    if (neonUser) {
      const expectedPin = neonUser.pin || "1234";
      if (expectedPin !== trimmedPin) {
        return {
          success: false,
          message: "Incorrect PIN or password. Please try again.",
        };
      }
      await setCurrentUser(neonUser);
      // Cache locally
      const cached = await getStoredUsers();
      const updated = [neonUser, ...cached.filter((u) => u.id !== neonUser.id)];
      await AsyncStorage.setItem(
        STORAGE_KEY_ALL_ACCOUNTS,
        JSON.stringify(updated),
      );
      return { success: true, user: neonUser };
    }
  } catch (err) {
    console.warn("Neon DB login lookup failed, checking local cache:", err);
  }

  // 2. Fall back to local AsyncStorage cache
  const users = await getStoredUsers();
  const found = users.find(
    (u) =>
      u.emailOrPhone.toLowerCase() === normalized ||
      u.name.toLowerCase().includes(normalized),
  );

  if (!found) {
    return {
      success: false,
      message: "User account not found. Please create a new account.",
    };
  }

  const expectedPin = found.pin || "1234";
  if (expectedPin !== trimmedPin) {
    return {
      success: false,
      message: "Incorrect PIN or password. Please try again.",
    };
  }

  // Sync to Neon DB in background if it wasn't there
  upsertUserToNeon(found).catch(() => {});

  await setCurrentUser(found);
  return { success: true, user: found };
}

export async function signup(
  name: string,
  emailOrPhone: string,
  passwordOrPin: string,
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  if (!name.trim()) {
    return { success: false, message: "Please enter your name." };
  }
  if (!emailOrPhone.trim()) {
    return { success: false, message: "Please enter your mobile or email." };
  }
  if (!passwordOrPin || !passwordOrPin.trim()) {
    return { success: false, message: "Please set a 4-digit PIN or password." };
  }
  if (passwordOrPin.trim().length < 4) {
    return {
      success: false,
      message: "PIN or password must be at least 4 digits.",
    };
  }

  const normalized = emailOrPhone.trim().toLowerCase();
  const trimmedPin = passwordOrPin.trim();

  // Check if account already exists in Neon DB
  try {
    const existingNeonUser = await fetchUserFromNeon(normalized);
    if (existingNeonUser) {
      if (existingNeonUser.pin === trimmedPin) {
        await setCurrentUser(existingNeonUser);
        return { success: true, user: existingNeonUser };
      }
      return {
        success: false,
        message:
          "An account with this email/mobile already exists. Please log in.",
      };
    }
  } catch (err) {
    console.warn(
      "Neon DB check during signup failed, proceeding with local check:",
      err,
    );
  }

  // Check if exists in local storage
  const users = await getStoredUsers();
  const exists = users.find((u) => u.emailOrPhone.toLowerCase() === normalized);
  if (exists) {
    if (exists.pin === trimmedPin) {
      await setCurrentUser(exists);
      return { success: true, user: exists };
    }
    return {
      success: false,
      message:
        "An account with this email/mobile already exists. Please log in.",
    };
  }

  const colors = [
    "#059669",
    "#D97706",
    "#2563EB",
    "#7C3AED",
    "#DC2626",
    "#0891B2",
  ];
  const avatarColor = colors[users.length % colors.length];

  const newUser: UserAccount = {
    id: "user_" + Date.now(),
    name: name.trim(),
    emailOrPhone: emailOrPhone.trim(),
    avatarColor,
    created_at: new Date().toISOString(),
    pin: trimmedPin,
  };

  // 1. Insert into Neon PostgreSQL
  try {
    await upsertUserToNeon(newUser);
    console.log(
      "✅ User successfully inserted into Neon DB:",
      newUser.name,
      newUser.emailOrPhone,
    );
  } catch (dbErr: any) {
    console.error("❌ Failed to insert user into Neon DB:", dbErr);
    return {
      success: false,
      message: `Failed to save user to database: ${dbErr?.message || "Connection error"}. Please verify database connection.`,
    };
  }

  // 2. Cache in local AsyncStorage
  const updatedUsers = [newUser, ...users.filter((u) => u.id !== newUser.id)];
  await AsyncStorage.setItem(
    STORAGE_KEY_ALL_ACCOUNTS,
    JSON.stringify(updatedUsers),
  );
  await setCurrentUser(newUser);

  return { success: true, user: newUser };
}

export async function logout(): Promise<void> {
  await setCurrentUser(null);
}
