import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workspace, WorkspaceMember, UserAccount } from '../types';

const STORAGE_KEY_WORKSPACES = '@kirana_workspaces_v1';
const STORAGE_KEY_MEMBERS = '@kirana_workspace_members_v1';
const STORAGE_KEY_ACTIVE_WS_PREFIX = '@kirana_active_ws_for_user_';

export const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_default',
  name: 'Apna Kirana Store',
  joinCode: 'APNA-2026',
  ownerId: 'user_ramesh',
  ownerName: 'Ramesh',
  created_at: new Date('2026-09-01').toISOString(),
};

export const DEFAULT_MEMBERS: WorkspaceMember[] = [
  {
    id: 'mem_1',
    workspaceId: 'ws_default',
    userId: 'user_ramesh',
    userName: 'Ramesh',
    role: 'Owner',
    joined_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'mem_2',
    workspaceId: 'ws_default',
    userId: 'user_suresh',
    userName: 'Suresh',
    role: 'Manager',
    joined_at: new Date('2026-09-01').toISOString(),
  },
];

export async function getAllWorkspaces(): Promise<Workspace[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_WORKSPACES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading workspaces:', err);
  }
  await AsyncStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify([DEFAULT_WORKSPACE]));
  return [DEFAULT_WORKSPACE];
}

export async function getAllMembers(): Promise<WorkspaceMember[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_MEMBERS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading members:', err);
  }
  await AsyncStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
  return DEFAULT_MEMBERS;
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const [workspaces, members] = await Promise.all([
    getAllWorkspaces(),
    getAllMembers(),
  ]);

  const userWorkspaceIds = new Set(
    members.filter((m) => m.userId === userId).map((m) => m.workspaceId)
  );

  return workspaces.filter((ws) => userWorkspaceIds.has(ws.id) || ws.ownerId === userId);
}

export async function getActiveWorkspace(userId: string): Promise<Workspace | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_WS_PREFIX + userId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading active workspace:', err);
  }
  const userWs = await getUserWorkspaces(userId);
  if (userWs.length > 0) {
    await setActiveWorkspace(userId, userWs[0]);
    return userWs[0];
  }
  return null;
}

export async function setActiveWorkspace(userId: string, workspace: Workspace): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_ACTIVE_WS_PREFIX + userId,
      JSON.stringify(workspace)
    );
  } catch (err) {
    console.warn('Error saving active workspace:', err);
  }
}

export function generateJoinCode(storeName: string): string {
  const cleanName = storeName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'STORE';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}-${randomDigits}`;
}

export async function createWorkspace(
  name: string,
  user: UserAccount
): Promise<{ success: boolean; workspace: Workspace }> {
  const workspaces = await getAllWorkspaces();
  const members = await getAllMembers();

  const joinCode = generateJoinCode(name);
  const newWs: Workspace = {
    id: 'ws_' + Date.now(),
    name: name.trim(),
    joinCode,
    ownerId: user.id,
    ownerName: user.name,
    created_at: new Date().toISOString(),
  };

  const newMember: WorkspaceMember = {
    id: 'mem_' + Date.now(),
    workspaceId: newWs.id,
    userId: user.id,
    userName: user.name,
    role: 'Owner',
    joined_at: new Date().toISOString(),
  };

  const updatedWorkspaces = [...workspaces, newWs];
  const updatedMembers = [...members, newMember];

  await AsyncStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(updatedWorkspaces));
  await AsyncStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
  await setActiveWorkspace(user.id, newWs);

  return { success: true, workspace: newWs };
}

export async function joinWorkspaceByCode(
  code: string,
  user: UserAccount
): Promise<{ success: boolean; workspace?: Workspace; message?: string }> {
  const normalizedCode = code.trim().toUpperCase();
  const workspaces = await getAllWorkspaces();
  const members = await getAllMembers();

  const targetWs = workspaces.find((ws) => ws.joinCode.toUpperCase() === normalizedCode);

  if (!targetWs) {
    return {
      success: false,
      message: `No store found with code "${normalizedCode}". Please check with your store partner or owner and try again.`,
    };
  }

  // Check if already a member
  const alreadyMember = members.find(
    (m) => m.workspaceId === targetWs.id && m.userId === user.id
  );

  if (!alreadyMember) {
    const newMember: WorkspaceMember = {
      id: 'mem_' + Date.now(),
      workspaceId: targetWs.id,
      userId: user.id,
      userName: user.name,
      role: 'Manager',
      joined_at: new Date().toISOString(),
    };
    const updatedMembers = [...members, newMember];
    await AsyncStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
  }

  await setActiveWorkspace(user.id, targetWs);
  return { success: true, workspace: targetWs };
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const members = await getAllMembers();
  return members.filter((m) => m.workspaceId === workspaceId);
}
