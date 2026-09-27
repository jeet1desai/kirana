import { neon } from "@neondatabase/serverless";
import {
  Product,
  PriceHistory,
  ActivityLog,
  ProductVariant,
  Workspace,
  WorkspaceMember,
  UserAccount,
} from "../types";

export const NEON_DATABASE_URL: string =
  process.env.EXPO_PUBLIC_NEON_DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

let sqlInstance: any = null;

function getSql() {
  if (!sqlInstance) {
    const url = NEON_DATABASE_URL;
    if (!url) {
      console.warn(
        "⚠️ NEON_DATABASE_URL is not set. Please define EXPO_PUBLIC_NEON_DATABASE_URL in your .env file."
      );
      throw new Error(
        "Database URL not configured. Please define EXPO_PUBLIC_NEON_DATABASE_URL in .env"
      );
    }
    sqlInstance = neon(url, {
      disableWarningInBrowsers: true,
    });
  }
  return sqlInstance;
}

// Lazy SQL tagged template wrapper
const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  return getSql()(strings, ...values);
};

/**
 * Test connection to Neon PostgreSQL
 */
export async function testNeonConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const res = await sql`SELECT NOW() as current_time, 1 as status`;
    if (res && res.length > 0) {
      return {
        success: true,
        message: "Connected to Neon PostgreSQL database successfully!",
      };
    }
    return { success: false, message: "No response from database" };
  } catch (err: any) {
    console.error("Neon DB connection test failed:", err);
    return {
      success: false,
      message: err.message || "Failed to connect to Neon DB",
    };
  }
}

/**
 * Fetch all products from Neon DB
 */
export async function fetchProductsFromNeon(
  workspaceId?: string,
): Promise<Product[]> {
  try {
    let rows: any[];
    if (workspaceId) {
      rows = await sql`
        SELECT * FROM products 
        WHERE workspace_id = ${workspaceId} OR workspace_id IS NULL 
        ORDER BY updated_at DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM products 
        ORDER BY updated_at DESC
      `;
    }

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category || "General",
      brand: r.brand || undefined,
      unit: r.unit,
      purchase_price: parseFloat(r.purchase_price) || 0,
      selling_price: parseFloat(r.selling_price) || 0,
      variants: Array.isArray(r.variants)
        ? (r.variants as ProductVariant[])
        : typeof r.variants === "string"
          ? JSON.parse(r.variants)
          : [],
      current_stock: r.current_stock ? parseFloat(r.current_stock) : undefined,
      min_stock: r.min_stock ? parseFloat(r.min_stock) : undefined,
      barcode: r.barcode || undefined,
      updated_at: r.updated_at
        ? new Date(r.updated_at).toISOString()
        : new Date().toISOString(),
      updated_by: r.updated_by || "Staff",
      workspace_id: r.workspace_id || undefined,
    }));
  } catch (err) {
    console.error("Error fetching products from Neon DB:", err);
    throw err;
  }
}

/**
 * Upsert a product into Neon DB
 */
export async function upsertProductToNeon(product: Product): Promise<void> {
  try {
    const variantsJson = JSON.stringify(product.variants || []);
    const updatedAt = product.updated_at || new Date().toISOString();
    const updatedBy = product.updated_by || "Staff";
    const brand = product.brand || null;
    const category = product.category || "General";
    const workspaceId = product.workspace_id || null;
    const purchasePrice = product.purchase_price || 0;
    const sellingPrice = product.selling_price || 0;
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    const barcode = product.barcode || null;

    await sql`
      INSERT INTO products (
        id, name, category, brand, unit, purchase_price, selling_price,
        variants, current_stock, min_stock, barcode, updated_at, updated_by, workspace_id
      ) VALUES (
        ${product.id},
        ${product.name},
        ${category},
        ${brand},
        ${product.unit},
        ${purchasePrice},
        ${sellingPrice},
        ${variantsJson}::jsonb,
        ${currentStock},
        ${minStock},
        ${barcode},
        ${updatedAt}::timestamptz,
        ${updatedBy},
        ${workspaceId}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        brand = EXCLUDED.brand,
        unit = EXCLUDED.unit,
        purchase_price = EXCLUDED.purchase_price,
        selling_price = EXCLUDED.selling_price,
        variants = EXCLUDED.variants,
        current_stock = EXCLUDED.current_stock,
        min_stock = EXCLUDED.min_stock,
        barcode = EXCLUDED.barcode,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        workspace_id = EXCLUDED.workspace_id;
    `;
  } catch (err) {
    console.error("Error upserting product to Neon DB:", err);
    throw err;
  }
}

/**
 * Delete product from Neon DB
 */
export async function deleteProductFromNeon(productId: string): Promise<void> {
  try {
    await sql`DELETE FROM products WHERE id = ${productId}`;
  } catch (err) {
    console.error("Error deleting product from Neon DB:", err);
    throw err;
  }
}

/**
 * Fetch price history from Neon DB
 */
export async function fetchPriceHistoryFromNeon(
  productId?: string,
  limit = 50,
): Promise<PriceHistory[]> {
  try {
    let rows: any[];
    if (productId) {
      rows = await sql`
        SELECT * FROM price_history 
        WHERE product_id = ${productId} 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT * FROM price_history 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
    }

    return rows.map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      old_price: parseFloat(r.old_price) || 0,
      new_price: parseFloat(r.new_price) || 0,
      changed_by: r.changed_by,
      reason: r.reason || undefined,
      created_at: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      workspace_id: r.workspace_id || undefined,
    }));
  } catch (err) {
    console.error("Error fetching price history from Neon DB:", err);
    throw err;
  }
}

/**
 * Insert price history record into Neon DB
 */
export async function insertPriceHistoryToNeon(
  history: PriceHistory,
): Promise<void> {
  try {
    const createdAt = history.created_at || new Date().toISOString();
    const reason = history.reason || null;
    const workspaceId = history.workspace_id || null;

    await sql`
      INSERT INTO price_history (
        id, product_id, product_name, old_price, new_price, changed_by, reason, created_at, workspace_id
      ) VALUES (
        ${history.id},
        ${history.product_id},
        ${history.product_name},
        ${history.old_price},
        ${history.new_price},
        ${history.changed_by},
        ${reason},
        ${createdAt}::timestamptz,
        ${workspaceId}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  } catch (err) {
    console.error("Error inserting price history to Neon DB:", err);
    throw err;
  }
}

/**
 * Fetch activity logs from Neon DB
 */
export async function fetchActivityLogsFromNeon(
  limit = 50,
): Promise<ActivityLog[]> {
  try {
    const rows = await sql`
      SELECT * FROM activity_logs 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;

    return rows.map((r: any) => ({
      id: r.id,
      action_type: r.action_type,
      title: r.title,
      description: r.description,
      user_name: r.user_name,
      created_at: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      workspace_id: r.workspace_id || undefined,
    }));
  } catch (err) {
    console.error("Error fetching activity logs from Neon DB:", err);
    throw err;
  }
}

/**
 * Insert activity log record into Neon DB
 */
export async function insertActivityLogToNeon(log: ActivityLog): Promise<void> {
  try {
    const createdAt = log.created_at || new Date().toISOString();
    const workspaceId = log.workspace_id || null;

    await sql`
      INSERT INTO activity_logs (
        id, action_type, title, description, user_name, created_at, workspace_id
      ) VALUES (
        ${log.id},
        ${log.action_type},
        ${log.title},
        ${log.description},
        ${log.user_name},
        ${createdAt}::timestamptz,
        ${workspaceId}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  } catch (err) {
    console.error("Error inserting activity log to Neon DB:", err);
    throw err;
  }
}

/**
 * Fetch all workspaces from Neon DB
 */
export async function fetchWorkspacesFromNeon(): Promise<Workspace[]> {
  try {
    const rows = await sql`
      SELECT * FROM workspaces ORDER BY created_at DESC
    `;
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      joinCode: r.join_code,
      ownerId: r.owner_id,
      ownerName: r.owner_name,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Error fetching workspaces from Neon DB:", err);
    throw err;
  }
}

/**
 * Upsert workspace into Neon DB
 */
export async function upsertWorkspaceToNeon(ws: Workspace): Promise<void> {
  try {
    const createdAt = ws.created_at || new Date().toISOString();
    await sql`
      INSERT INTO workspaces (
        id, name, join_code, owner_id, owner_name, created_at
      ) VALUES (
        ${ws.id},
        ${ws.name},
        ${ws.joinCode},
        ${ws.ownerId},
        ${ws.ownerName},
        ${createdAt}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        join_code = EXCLUDED.join_code,
        owner_id = EXCLUDED.owner_id,
        owner_name = EXCLUDED.owner_name;
    `;
  } catch (err) {
    console.error("Error upserting workspace to Neon DB:", err);
    throw err;
  }
}

/**
 * Fetch workspace members from Neon DB
 */
export async function fetchMembersFromNeon(workspaceId?: string): Promise<WorkspaceMember[]> {
  try {
    let rows: any[];
    if (workspaceId) {
      rows = await sql`
        SELECT * FROM workspace_members 
        WHERE workspace_id = ${workspaceId}
        ORDER BY joined_at ASC
      `;
    } else {
      rows = await sql`
        SELECT * FROM workspace_members 
        ORDER BY joined_at ASC
      `;
    }
    return rows.map((r: any) => ({
      id: r.id,
      workspaceId: r.workspace_id,
      userId: r.user_id,
      userName: r.user_name,
      role: r.role as "Owner" | "Manager" | "Staff",
      joined_at: r.joined_at ? new Date(r.joined_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Error fetching members from Neon DB:", err);
    throw err;
  }
}

export function isNeonConfigured(): boolean {
  return !!NEON_DATABASE_URL;
}

/**
 * Upsert workspace member into Neon DB
 */
export async function upsertMemberToNeon(member: WorkspaceMember): Promise<void> {
  try {
    const joinedAt = member.joined_at || new Date().toISOString();
    await sql`
      INSERT INTO workspace_members (
        id, workspace_id, user_id, user_name, role, joined_at
      ) VALUES (
        ${member.id},
        ${member.workspaceId},
        ${member.userId},
        ${member.userName},
        ${member.role},
        ${joinedAt}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        user_name = EXCLUDED.user_name,
        role = EXCLUDED.role;
    `;
  } catch (err) {
    console.error("Error upserting workspace member to Neon DB:", err);
    throw err;
  }
}

/**
 * Fetch a single user by email or phone from Neon DB
 */
export async function fetchUserFromNeon(
  emailOrPhone: string
): Promise<UserAccount | null> {
  try {
    const normalized = emailOrPhone.trim().toLowerCase();
    const rows = await sql`
      SELECT * FROM users 
      WHERE LOWER(email_or_phone) = ${normalized}
      LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      emailOrPhone: r.email_or_phone,
      avatarColor: r.avatar_color || "#2563EB",
      created_at: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      pin: r.pin,
    };
  } catch (err) {
    console.error("Error fetching user from Neon DB:", err);
    throw err;
  }
}

/**
 * Fetch all users from Neon DB
 */
export async function fetchAllUsersFromNeon(): Promise<UserAccount[]> {
  try {
    const rows = await sql`
      SELECT * FROM users ORDER BY created_at ASC
    `;
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      emailOrPhone: r.email_or_phone,
      avatarColor: r.avatar_color || "#2563EB",
      created_at: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      pin: r.pin,
    }));
  } catch (err) {
    console.error("Error fetching all users from Neon DB:", err);
    throw err;
  }
}

/**
 * Upsert a user into Neon DB
 */
export async function upsertUserToNeon(user: UserAccount): Promise<void> {
  try {
    const createdAt = user.created_at || new Date().toISOString();
    await sql`
      INSERT INTO users (
        id, name, email_or_phone, pin, avatar_color, created_at
      ) VALUES (
        ${user.id},
        ${user.name},
        ${user.emailOrPhone},
        ${user.pin || "1234"},
        ${user.avatarColor},
        ${createdAt}::timestamptz
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email_or_phone = EXCLUDED.email_or_phone,
        pin = EXCLUDED.pin,
        avatar_color = EXCLUDED.avatar_color;
    `;
  } catch (err) {
    console.error("Error upserting user to Neon DB:", err);
    throw err;
  }
}

