import AsyncStorage from "@react-native-async-storage/async-storage";
import { Workspace, WorkspaceMember, UserAccount } from "../types";
import {
  fetchWorkspacesFromNeon,
  upsertWorkspaceToNeon,
  fetchMembersFromNeon,
  upsertMemberToNeon,
} from "./neonClient";

const STORAGE_KEY_WORKSPACES = "@kirana_workspaces_v1";
const STORAGE_KEY_MEMBERS = "@kirana_workspace_members_v1";
const STORAGE_KEY_ACTIVE_WS_PREFIX = "@kirana_active_ws_for_user_";

export async function getAllWorkspaces(): Promise<Workspace[]> {
  // 1. Try to fetch live from Neon PostgreSQL
  try {
    const neonWs = await fetchWorkspacesFromNeon();
    if (neonWs && neonWs.length > 0) {
      await AsyncStorage.setItem(
        STORAGE_KEY_WORKSPACES,
        JSON.stringify(neonWs),
      );
      return neonWs;
    }
  } catch (err) {
    console.warn(
      "Error reading workspaces from Neon DB, falling back to local storage:",
      err,
    );
  }

  // 2. Fall back to local AsyncStorage cache
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_WORKSPACES);
    if (raw) {
      const parsed: Workspace[] = JSON.parse(raw);
      const cleaned = parsed.filter((w) => w.id !== "ws_default");
      // Sync any local workspaces to Neon DB in background
      for (const ws of cleaned) {
        upsertWorkspaceToNeon(ws).catch(() => {});
      }
      return cleaned;
    }
  } catch (err) {
    console.warn("Error reading workspaces from local storage:", err);
  }

  return [];
}

export async function getAllMembers(): Promise<WorkspaceMember[]> {
  try {
    const neonMembers = await fetchMembersFromNeon();
    if (neonMembers && neonMembers.length > 0) {
      await AsyncStorage.setItem(
        STORAGE_KEY_MEMBERS,
        JSON.stringify(neonMembers),
      );
      return neonMembers;
    }
  } catch (err) {
    console.warn(
      "Error reading members from Neon DB, falling back to local storage:",
      err,
    );
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_MEMBERS);
    if (raw) {
      const parsed: WorkspaceMember[] = JSON.parse(raw);
      const cleaned = parsed.filter(
        (m) => m.id !== "mem_1" && m.id !== "mem_2",
      );
      return cleaned;
    }
  } catch (err) {
    console.warn("Error reading members from local storage:", err);
  }

  return [];
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const [workspaces, members] = await Promise.all([
    getAllWorkspaces(),
    getAllMembers(),
  ]);

  const userWorkspaceIds = new Set(
    members.filter((m) => m.userId === userId).map((m) => m.workspaceId),
  );

  return workspaces.filter(
    (ws) => userWorkspaceIds.has(ws.id) || ws.ownerId === userId,
  );
}

export async function getActiveWorkspace(
  userId: string,
): Promise<Workspace | null> {
  try {
    const raw = await AsyncStorage.getItem(
      STORAGE_KEY_ACTIVE_WS_PREFIX + userId,
    );
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Error reading active workspace:", err);
  }
  const userWs = await getUserWorkspaces(userId);
  if (userWs.length > 0) {
    await setActiveWorkspace(userId, userWs[0]);
    return userWs[0];
  }
  return null;
}

export async function setActiveWorkspace(
  userId: string,
  workspace: Workspace,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_ACTIVE_WS_PREFIX + userId,
      JSON.stringify(workspace),
    );
  } catch (err) {
    console.warn("Error saving active workspace:", err);
  }
}

export function generateJoinCode(storeName: string): string {
  const cleanName =
    storeName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5) || "STORE";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}-${randomDigits}`;
}

export async function createWorkspace(
  name: string,
  user: UserAccount,
): Promise<{ success: boolean; workspace?: Workspace; message?: string }> {
  const workspaces = await getAllWorkspaces();
  const members = await getAllMembers();

  const joinCode = generateJoinCode(name);
  const newWs: Workspace = {
    id: "ws_" + Date.now(),
    name: name.trim(),
    joinCode,
    ownerId: user.id,
    ownerName: user.name,
    created_at: new Date().toISOString(),
  };

  const newMember: WorkspaceMember = {
    id: "mem_" + Date.now(),
    workspaceId: newWs.id,
    userId: user.id,
    userName: user.name,
    role: "Owner",
    joined_at: new Date().toISOString(),
  };

  // 1. Sync to Neon PostgreSQL
  try {
    await upsertWorkspaceToNeon(newWs);
    await upsertMemberToNeon(newMember);
    console.log("✅ Workspace and owner saved to Neon DB:", newWs.name, newWs.joinCode);
  } catch (neonErr: any) {
    console.error("❌ Failed to sync new workspace to Neon DB:", neonErr);
    return {
      success: false,
      message: `Failed to save workspace to database: ${neonErr?.message || "Connection error"}. Please check database connection.`,
    };
  }

  // 2. Cache in local storage
  const updatedWorkspaces = [
    newWs,
    ...workspaces.filter((w) => w.id !== newWs.id),
  ];
  const updatedMembers = [
    newMember,
    ...members.filter((m) => m.id !== newMember.id),
  ];

  await AsyncStorage.setItem(
    STORAGE_KEY_WORKSPACES,
    JSON.stringify(updatedWorkspaces),
  );
  await AsyncStorage.setItem(
    STORAGE_KEY_MEMBERS,
    JSON.stringify(updatedMembers),
  );
  await setActiveWorkspace(user.id, newWs);

  return { success: true, workspace: newWs };
}

export async function joinWorkspaceByCode(
  code: string,
  user: UserAccount,
): Promise<{ success: boolean; workspace?: Workspace; message?: string }> {
  const normalizedCode = code.trim().toUpperCase();
  const workspaces = await getAllWorkspaces();
  const members = await getAllMembers();

  const targetWs = workspaces.find(
    (ws) => ws.joinCode.toUpperCase() === normalizedCode,
  );

  if (!targetWs) {
    return {
      success: false,
      message: `No store found with code "${normalizedCode}". Please check with your store partner or owner and try again.`,
    };
  }

  // Check if already a member
  const alreadyMember = members.find(
    (m) => m.workspaceId === targetWs.id && m.userId === user.id,
  );

  if (!alreadyMember) {
    const newMember: WorkspaceMember = {
      id: "mem_" + Date.now(),
      workspaceId: targetWs.id,
      userId: user.id,
      userName: user.name,
      role: "Manager",
      joined_at: new Date().toISOString(),
    };
    const updatedMembers = [...members, newMember];
    await AsyncStorage.setItem(
      STORAGE_KEY_MEMBERS,
      JSON.stringify(updatedMembers),
    );

    try {
      await upsertMemberToNeon(newMember);
    } catch (neonErr) {
      console.warn("Failed to sync new member to Neon DB:", neonErr);
    }
  }

  await setActiveWorkspace(user.id, targetWs);
  return { success: true, workspace: targetWs };
}

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  try {
    const neonMembers = await fetchMembersFromNeon(workspaceId);
    if (neonMembers && neonMembers.length > 0) {
      return neonMembers;
    }
  } catch (err) {
    console.warn("Error reading members from Neon DB:", err);
  }
  const members = await getAllMembers();
  return members.filter((m) => m.workspaceId === workspaceId);
}
