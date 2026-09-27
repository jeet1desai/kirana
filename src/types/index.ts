export type UnitType =
  | "kg"
  | "500g"
  | "250g"
  | "100g"
  | "1L"
  | "500ml"
  | "pkt"
  | "pc"
  | "bag"
  | "box"
  | "dozen";

export interface UserAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  avatarColor: string;
  created_at: string;
  pin?: string;
}

export interface Workspace {
  id: string;
  name: string;
  joinCode: string; // e.g. "APNA-2026"
  ownerId: string;
  ownerName: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  role: "Owner" | "Manager" | "Staff";
  joined_at: string;
}

export interface ProductVariant {
  id: string;
  unit: string;
  selling_price: number;
}

export interface Product {
  id: string;
  workspace_id?: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  current_stock?: number;
  min_stock?: number;
  barcode?: string;
  updated_at: string;
  updated_by: string;
  variants?: ProductVariant[];
}

export interface PriceHistory {
  id: string;
  workspace_id?: string;
  product_id: string;
  product_name: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  reason?: string;
  created_at: string;
}

export type ActionType =
  | "PRICE_CHANGE"
  | "STOCK_UPDATE"
  | "PRODUCT_ADD"
  | "PRODUCT_DELETE"
  | "SYSTEM";

export interface ActivityLog {
  id: string;
  workspace_id?: string;
  action_type: ActionType;
  title: string;
  description: string;
  user_name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: "Admin" | "Manager" | "Staff";
  shortName: string;
  color: string;
}

export type SyncStatusType = "connected" | "syncing" | "local" | "error";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SyncNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  changedBy: string;
}
