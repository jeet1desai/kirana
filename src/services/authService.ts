import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserAccount } from '../types';

const STORAGE_KEY_AUTH_USER = '@kirana_auth_user_v1';
const STORAGE_KEY_ALL_ACCOUNTS = '@kirana_all_accounts_v1';

export const DEMO_USERS: UserAccount[] = [
  {
    id: 'user_ramesh',
    name: 'Ramesh',
    emailOrPhone: '9876543210',
    avatarColor: '#2563EB',
    created_at: new Date('2026-09-01').toISOString(),
    pin: '1234',
  },
  {
    id: 'user_suresh',
    name: 'Suresh',
    emailOrPhone: '9876543211',
    avatarColor: '#7C3AED',
    created_at: new Date('2026-09-01').toISOString(),
    pin: '1234',
  },
];

export async function getStoredUsers(): Promise<UserAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ALL_ACCOUNTS);
    if (raw) {
      const parsed: UserAccount[] = JSON.parse(raw);
      return parsed.map((u) => ({
        ...u,
        pin: u.pin || '1234',
      }));
    }
  } catch (err) {
    console.warn('Error reading stored users:', err);
  }
  // Initialize with default demo accounts
  await AsyncStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(DEMO_USERS));
  return DEMO_USERS;
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading current user:', err);
  }
  // Default to Ramesh logged in on initial launch for seamless first-time experience
  await setCurrentUser(DEMO_USERS[0]);
  return DEMO_USERS[0];
}

export async function setCurrentUser(user: UserAccount | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_AUTH_USER);
    }
  } catch (err) {
    console.warn('Error setting current user:', err);
  }
}

export async function login(
  emailOrPhone: string,
  passwordOrPin: string
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  if (!emailOrPhone.trim()) {
    return { success: false, message: 'Please enter your mobile number or email.' };
  }
  if (!passwordOrPin || !passwordOrPin.trim()) {
    return { success: false, message: 'Please enter your 4-digit PIN or password.' };
  }
  if (passwordOrPin.trim().length < 4) {
    return { success: false, message: 'PIN or password must be at least 4 digits.' };
  }

  const users = await getStoredUsers();
  const normalized = emailOrPhone.trim().toLowerCase();
  const trimmedPin = passwordOrPin.trim();

  const found = users.find(
    (u) =>
      u.emailOrPhone.toLowerCase() === normalized ||
      u.name.toLowerCase().includes(normalized)
  );

  if (!found) {
    return {
      success: false,
      message: 'User account not found. Please create a new account.',
    };
  }

  const expectedPin = found.pin || '1234';
  if (expectedPin !== trimmedPin) {
    return {
      success: false,
      message: 'Incorrect PIN or password. Please try again.',
    };
  }

  await setCurrentUser(found);
  return { success: true, user: found };
}

export async function signup(
  name: string,
  emailOrPhone: string,
  passwordOrPin: string
): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
  if (!name.trim()) {
    return { success: false, message: 'Please enter your name.' };
  }
  if (!emailOrPhone.trim()) {
    return { success: false, message: 'Please enter your mobile or email.' };
  }
  if (!passwordOrPin || !passwordOrPin.trim()) {
    return { success: false, message: 'Please set a 4-digit PIN or password.' };
  }
  if (passwordOrPin.trim().length < 4) {
    return { success: false, message: 'PIN or password must be at least 4 digits.' };
  }

  const users = await getStoredUsers();
  const normalized = emailOrPhone.trim().toLowerCase();
  const trimmedPin = passwordOrPin.trim();

  const exists = users.find(
    (u) => u.emailOrPhone.toLowerCase() === normalized
  );
  if (exists) {
    const expectedPin = exists.pin || '1234';
    if (expectedPin !== trimmedPin) {
      return {
        success: false,
        message: 'An account with this email/mobile already exists with a different PIN. Please log in.',
      };
    }
    await setCurrentUser(exists);
    return { success: true, user: exists };
  }

  const colors = ['#059669', '#D97706', '#2563EB', '#7C3AED', '#DC2626', '#0891B2'];
  const avatarColor = colors[users.length % colors.length];

  const newUser: UserAccount = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    emailOrPhone: emailOrPhone.trim(),
    avatarColor,
    created_at: new Date().toISOString(),
    pin: trimmedPin,
  };

  const updatedUsers = [...users, newUser];
  await AsyncStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(updatedUsers));
  await setCurrentUser(newUser);

  return { success: true, user: newUser };
}

export async function demoLogin(userId: string): Promise<UserAccount> {
  const users = await getStoredUsers();
  const target = users.find((u) => u.id === userId) || DEMO_USERS[0];
  await setCurrentUser(target);
  return target;
}

export async function logout(): Promise<void> {
  await setCurrentUser(null);
}
