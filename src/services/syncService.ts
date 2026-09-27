import {
  Product,
  PriceHistory,
  ActivityLog,
  SyncStatusType,
  SyncNotification,
} from "../types";
import { getSupabaseClient } from "./supabaseClient";
import {
  saveProducts,
  savePriceHistory,
  saveActivityLogs,
} from "./storageService";
import {
  upsertProductToNeon,
  insertPriceHistoryToNeon,
  insertActivityLogToNeon,
} from "./neonClient";

type SyncListener = {
  onProductsUpdated: (products: Product[]) => void;
  onPriceHistoryUpdated: (history: PriceHistory[]) => void;
  onActivityLogsUpdated: (logs: ActivityLog[]) => void;
  onNotificationReceived: (notification: SyncNotification) => void;
  onStatusChanged: (status: SyncStatusType) => void;
};

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatusType = "local";
  private channel: any = null;
  private webBroadcastChannel: any = null;

  constructor() {
    this.initWebBroadcast();
  }

  private initWebBroadcast() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.webBroadcastChannel = new (window as any).BroadcastChannel(
          "kirana_sync_bus",
        );
        this.webBroadcastChannel.onmessage = (event: MessageEvent) => {
          this.handleBroadcastMessage(event.data);
        };
      } catch (err) {
        console.warn("BroadcastChannel not supported in this runtime");
      }
    }
  }

  private handleBroadcastMessage(data: any) {
    if (!data || !data.type) return;

    if (data.type === "PRICE_UPDATED") {
      const { product, historyItem, activityItem, senderName } = data.payload;
      this.notifyNotification({
        id: "notif_" + Date.now(),
        title: "Price Updated in Real-Time",
        message: `${senderName} updated ${product.name}: ₹${historyItem.old_price} → ₹${historyItem.new_price}`,
        timestamp: new Date().toISOString(),
        changedBy: senderName,
      });
      if (data.allProducts) {
        this.notifyProducts(data.allProducts);
      }
      if (data.allHistory) {
        this.notifyPriceHistory(data.allHistory);
      }
      if (data.allActivity) {
        this.notifyActivityLogs(data.allActivity);
      }
    } else if (data.type === "STOCK_UPDATED") {
      if (data.allProducts) this.notifyProducts(data.allProducts);
      if (data.allActivity) this.notifyActivityLogs(data.allActivity);
    } else if (data.type === "PRODUCT_ADDED") {
      if (data.allProducts) this.notifyProducts(data.allProducts);
      if (data.allActivity) this.notifyActivityLogs(data.allActivity);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener.onStatusChanged(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): SyncStatusType {
    return this.status;
  }

  public setStatus(status: SyncStatusType) {
    this.status = status;
    this.listeners.forEach((l) => l.onStatusChanged(status));
  }

  private notifyProducts(products: Product[]) {
    this.listeners.forEach((l) => l.onProductsUpdated(products));
  }

  private notifyPriceHistory(history: PriceHistory[]) {
    this.listeners.forEach((l) => l.onPriceHistoryUpdated(history));
  }

  private notifyActivityLogs(logs: ActivityLog[]) {
    this.listeners.forEach((l) => l.onActivityLogsUpdated(logs));
  }

  private notifyNotification(notification: SyncNotification) {
    this.listeners.forEach((l) => l.onNotificationReceived(notification));
  }

  // Initialize Supabase Cloud Realtime Channel
  public async setupSupabaseRealtime(
    currentUserName: string,
    onRemoteProductUpdate: (updatedProduct: Product) => void,
    onRemoteHistoryInsert: (history: PriceHistory) => void,
  ) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      this.setStatus("local");
      return;
    }

    try {
      this.setStatus("syncing");

      // Fetch latest cloud state first
      const { data: cloudProducts, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (!prodErr && cloudProducts && cloudProducts.length > 0) {
        await saveProducts(cloudProducts);
        this.notifyProducts(cloudProducts);
      }

      const { data: cloudHistory, error: histErr } = await supabase
        .from("price_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!histErr && cloudHistory) {
        await savePriceHistory(cloudHistory);
        this.notifyPriceHistory(cloudHistory);
      }

      // Cleanup existing subscription
      if (this.channel) {
        await supabase.removeChannel(this.channel);
      }

      // Create new Realtime Channel
      this.channel = supabase
        .channel("kirana_realtime_channel")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          (payload: any) => {
            if (
              payload.eventType === "UPDATE" ||
              payload.eventType === "INSERT"
            ) {
              const updatedProduct = payload.new as Product;
              onRemoteProductUpdate(updatedProduct);

              // If updated by someone else, show alert
              if (updatedProduct.updated_by !== currentUserName) {
                this.notifyNotification({
                  id: "notif_" + Date.now(),
                  title: "Real-Time Price Alert",
                  message: `${updatedProduct.updated_by} updated ${updatedProduct.name}: ₹${updatedProduct.selling_price}`,
                  timestamp: new Date().toISOString(),
                  changedBy: updatedProduct.updated_by,
                });
              }
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "price_history" },
          (payload: any) => {
            const newHistory = payload.new as PriceHistory;
            onRemoteHistoryInsert(newHistory);
          },
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            this.setStatus("connected");
          } else if (status === "CHANNEL_ERROR") {
            this.setStatus("error");
          }
        });

      this.setStatus("connected");
    } catch (err) {
      console.warn("Failed to setup Supabase realtime:", err);
      this.setStatus("local");
    }
  }

  // Broadcast price update across devices & tabs
  public async broadcastPriceUpdate(
    product: Product,
    historyItem: PriceHistory,
    activityItem: ActivityLog,
    allProducts: Product[],
    allHistory: PriceHistory[],
    allActivity: ActivityLog[],
    senderName: string,
  ) {
    // 1. Always save locally first
    await saveProducts(allProducts);
    await savePriceHistory(allHistory);
    await saveActivityLogs(allActivity);

    // 2. Broadcast to other tabs/windows if running in browser
    if (this.webBroadcastChannel) {
      this.webBroadcastChannel.postMessage({
        type: "PRICE_UPDATED",
        payload: { product, historyItem, activityItem, senderName },
        allProducts,
        allHistory,
        allActivity,
      });
    }

    // 3. Sync to Neon DB
    try {
      await upsertProductToNeon(product);
      await insertPriceHistoryToNeon(historyItem);
      await insertActivityLogToNeon(activityItem);
    } catch (neonErr) {
      console.warn("Failed to sync price update to Neon DB:", neonErr);
    }

    // 4. Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase && this.status === "connected") {
      try {
        await supabase.from("products").upsert({
          id: product.id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          unit: product.unit,
          purchase_price: product.purchase_price,
          selling_price: product.selling_price,
          current_stock: product.current_stock,
          min_stock: product.min_stock,
          barcode: product.barcode,
          updated_at: product.updated_at,
          updated_by: product.updated_by,
        });

        await supabase.from("price_history").insert({
          id: historyItem.id,
          product_id: historyItem.product_id,
          product_name: historyItem.product_name,
          old_price: historyItem.old_price,
          new_price: historyItem.new_price,
          changed_by: historyItem.changed_by,
          reason: historyItem.reason,
          created_at: historyItem.created_at,
        });

        await supabase.from("activity_logs").insert({
          id: activityItem.id,
          action_type: activityItem.action_type,
          title: activityItem.title,
          description: activityItem.description,
          user_name: activityItem.user_name,
          created_at: activityItem.created_at,
        });
      } catch (cloudErr) {
        console.warn("Failed to sync price update to Supabase:", cloudErr);
      }
    }
  }

  // Broadcast stock update
  public async broadcastStockUpdate(
    product: Product,
    activityItem: ActivityLog,
    allProducts: Product[],
    allActivity: ActivityLog[],
  ) {
    await saveProducts(allProducts);
    await saveActivityLogs(allActivity);

    if (this.webBroadcastChannel) {
      this.webBroadcastChannel.postMessage({
        type: "STOCK_UPDATED",
        payload: { product, activityItem },
        allProducts,
        allActivity,
      });
    }

    // Sync to Neon DB
    try {
      await upsertProductToNeon(product);
      await insertActivityLogToNeon(activityItem);
    } catch (neonErr) {
      console.warn("Error syncing stock to Neon DB:", neonErr);
    }

    const supabase = getSupabaseClient();
    if (supabase && this.status === "connected") {
      try {
        await supabase
          .from("products")
          .update({
            current_stock: product.current_stock,
            updated_at: product.updated_at,
            updated_by: product.updated_by,
          })
          .eq("id", product.id);

        await supabase.from("activity_logs").insert({
          id: activityItem.id,
          action_type: activityItem.action_type,
          title: activityItem.title,
          description: activityItem.description,
          user_name: activityItem.user_name,
          created_at: activityItem.created_at,
        });
      } catch (err) {
        console.warn("Error syncing stock to Supabase:", err);
      }
    }
  }

  // Broadcast product add
  public async broadcastProductAdd(
    product: Product,
    activityItem: ActivityLog,
    allProducts: Product[],
    allActivity: ActivityLog[],
  ) {
    await saveProducts(allProducts);
    await saveActivityLogs(allActivity);

    if (this.webBroadcastChannel) {
      this.webBroadcastChannel.postMessage({
        type: "PRODUCT_ADDED",
        payload: { product, activityItem },
        allProducts,
        allActivity,
      });
    }

    // Sync to Neon DB
    try {
      await upsertProductToNeon(product);
      await insertActivityLogToNeon(activityItem);
    } catch (neonErr) {
      console.warn("Error syncing new product to Neon DB:", neonErr);
    }

    const supabase = getSupabaseClient();
    if (supabase && this.status === "connected") {
      try {
        await supabase.from("products").insert(product);
        await supabase.from("activity_logs").insert(activityItem);
      } catch (err) {
        console.warn("Error syncing new product to Supabase:", err);
      }
    }
  }
}

export const syncService = new SyncService();
