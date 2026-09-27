import * as React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  Product,
  PriceHistory,
  ActivityLog,
  UserProfile,
  SyncStatusType,
  SyncNotification,
  SupabaseConfig,
} from "../types";
import {
  loadProducts,
  loadPriceHistory,
  loadActivityLogs,
  saveProducts,
  savePriceHistory,
  saveActivityLogs,
  loadUsers,
  loadActiveUser,
  saveActiveUser,
  saveUsers,
  resetToDefaultData,
  purgeLegacyDummyDataOnce,
} from "../services/storageService";
import {
  fetchProductsFromNeon,
  fetchPriceHistoryFromNeon,
  fetchActivityLogsFromNeon,
  deleteProductFromNeon,
  insertActivityLogToNeon,
} from "../services/neonClient";
import { syncService } from "../services/syncService";
import {
  initSupabaseClient,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from "../services/supabaseClient";

interface StoreContextValue {
  // Data
  products: Product[];
  priceHistory: PriceHistory[];
  activityLogs: ActivityLog[];
  users: UserProfile[];
  activeUser: UserProfile;
  syncStatus: SyncStatusType;
  currentNotification: SyncNotification | null;

  // Search & Filter
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Actions
  updatePrice: (
    productId: string,
    newPrice: number,
    reason?: string,
    variantId?: string,
  ) => Promise<void>;
  updateStock: (productId: string, delta: number) => Promise<void>;
  setStockDirect: (productId: string, newStock: number) => Promise<void>;
  addProduct: (
    productData: Omit<Product, "id" | "updated_at" | "updated_by">,
  ) => Promise<void>;
  addProducts: (
    productsData: Omit<Product, "id" | "updated_at" | "updated_by">[],
  ) => Promise<void>;
  editProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  switchUser: (user: UserProfile) => Promise<void>;
  addNewUser: (
    name: string,
    role: "Admin" | "Manager" | "Staff",
  ) => Promise<void>;
  dismissNotification: () => void;
  connectSupabase: (
    config: SupabaseConfig,
  ) => Promise<{ success: boolean; message: string }>;
  disconnectSupabase: () => Promise<void>;
  resetData: () => Promise<void>;
  getProductHistory: (productId: string) => PriceHistory[];
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser, activeWorkspace } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile>({
    id: currentUser?.id || "user_ramesh",
    name: currentUser?.name || "Ramesh",
    role: "Admin",
    shortName: currentUser?.name ? currentUser.name.split(" ")[0] : "Ramesh",
    color: currentUser?.avatarColor || "#2563EB",
  });

  // Sync activeUser with currentUser
  useEffect(() => {
    if (currentUser) {
      setActiveUser({
        id: currentUser.id,
        name: currentUser.name,
        role: "Admin",
        shortName: currentUser.name.split(" ")[0],
        color: currentUser.avatarColor,
      });
    }
  }, [currentUser]);

  const [syncStatus, setSyncStatus] = useState<SyncStatusType>("local");
  const [currentNotification, setCurrentNotification] =
    useState<SyncNotification | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Initial load or workspace change
  useEffect(() => {
    async function init() {
      // 1. Purge any legacy dummy data from earlier demo runs
      await purgeLegacyDummyDataOnce();

      const [initUsers, initActiveUser] = await Promise.all([
        loadUsers(),
        loadActiveUser(),
      ]);
      setUsers(initUsers);
      if (!currentUser) {
        setActiveUser(initActiveUser);
      }

      const currentWsId = activeWorkspace?.id;

      // 2. Fetch live data directly from Neon PostgreSQL
      try {
        const [neonProds, neonHist, neonLogs] = await Promise.all([
          fetchProductsFromNeon(currentWsId),
          fetchPriceHistoryFromNeon(undefined, 50),
          fetchActivityLogsFromNeon(50),
        ]);

        setProducts(neonProds);
        setPriceHistory(neonHist);
        setActivityLogs(neonLogs);

        await Promise.all([
          saveProducts(neonProds),
          savePriceHistory(neonHist),
          saveActivityLogs(neonLogs),
        ]);
        setSyncStatus("connected");
      } catch (neonErr) {
        console.warn("Neon DB fetch failed, falling back to local cache:", neonErr);
        const [initProds, initHist, initLogs] = await Promise.all([
          loadProducts(),
          loadPriceHistory(),
          loadActivityLogs(),
        ]);

        const wsProds = currentWsId
          ? initProds.filter(
              (p) => !p.workspace_id || p.workspace_id === currentWsId,
            )
          : initProds;
        const wsHist = currentWsId
          ? initHist.filter(
              (h) => !h.workspace_id || h.workspace_id === currentWsId,
            )
          : initHist;
        const wsLogs = currentWsId
          ? initLogs.filter(
              (l) => !l.workspace_id || l.workspace_id === currentWsId,
            )
          : initLogs;

        setProducts(wsProds);
        setPriceHistory(wsHist);
        setActivityLogs(wsLogs);
        setSyncStatus("local");
      }

      // Check for Supabase
      const client = await initSupabaseClient();
      if (client) {
        const activeName = currentUser?.name || initActiveUser.name;
        await syncService.setupSupabaseRealtime(
          activeName,
          (remoteProduct) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === remoteProduct.id ? remoteProduct : p)),
            );
          },
          (remoteHistory) => {
            setPriceHistory((prev) => [remoteHistory, ...prev]);
          },
        );
      }
    }

    init();
  }, [activeWorkspace?.id, currentUser?.id]);

  // Subscribe to syncService updates (broadcasts from other tabs/peers)
  useEffect(() => {
    const unsubscribe = syncService.subscribe({
      onProductsUpdated: (prods) => setProducts(prods),
      onPriceHistoryUpdated: (hist) => setPriceHistory(hist),
      onActivityLogsUpdated: (logs) => setActivityLogs(logs),
      onNotificationReceived: (notif) => {
        setCurrentNotification(notif);
      },
      onStatusChanged: (status) => setSyncStatus(status),
    });

    return unsubscribe;
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (currentNotification) {
      const timer = setTimeout(() => {
        setCurrentNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentNotification]);

  // Update Price (Core Requirement)
  const updatePrice = useCallback(
    async (
      productId: string,
      newPrice: number,
      reason?: string,
      variantId?: string,
    ) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      let oldPrice = product.selling_price;
      let targetUnit = product.unit;
      let updatedVariants = product.variants
        ? [...product.variants]
        : undefined;

      if (variantId && updatedVariants && updatedVariants.length > 0) {
        const vIdx = updatedVariants.findIndex((v) => v.id === variantId);
        if (vIdx !== -1) {
          oldPrice = updatedVariants[vIdx].selling_price;
          targetUnit = updatedVariants[vIdx].unit;
          updatedVariants[vIdx] = {
            ...updatedVariants[vIdx],
            selling_price: newPrice,
          };
        }
      }

      const now = new Date().toISOString();

      const updatedProduct: Product = {
        ...product,
        selling_price:
          variantId && updatedVariants && updatedVariants[0]?.id !== variantId
            ? product.selling_price
            : newPrice,
        unit:
          variantId && updatedVariants && updatedVariants[0]?.id === variantId
            ? updatedVariants[0].unit
            : product.unit,
        variants: updatedVariants,
        workspace_id: activeWorkspace?.id,
        updated_at: now,
        updated_by: activeUser.name,
      };

      const historyItem: PriceHistory = {
        id: "hist_" + Date.now(),
        workspace_id: activeWorkspace?.id,
        product_id: product.id,
        product_name: `${product.name} (${targetUnit})`,
        old_price: oldPrice,
        new_price: newPrice,
        changed_by: activeUser.name,
        reason: reason || "Price adjusted",
        created_at: now,
      };

      const delta = newPrice - oldPrice;
      const deltaSign = delta >= 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`;

      const activityItem: ActivityLog = {
        id: "act_" + Date.now(),
        action_type: "PRICE_CHANGE",
        title: `${product.name} (${targetUnit}) price updated`,
        description: `₹${oldPrice} → ₹${newPrice} (${deltaSign}) by ${activeUser.name}`,
        user_name: activeUser.name,
        created_at: now,
      };

      const newProducts = products.map((p) =>
        p.id === productId ? updatedProduct : p,
      );
      const newHistory = [historyItem, ...priceHistory];
      const newLogs = [activityItem, ...activityLogs];

      // Optimistic local update
      setProducts(newProducts);
      setPriceHistory(newHistory);
      setActivityLogs(newLogs);

      // Broadcast to cloud / other windows
      await syncService.broadcastPriceUpdate(
        updatedProduct,
        historyItem,
        activityItem,
        newProducts,
        newHistory,
        newLogs,
        activeUser.name,
      );
    },
    [products, priceHistory, activityLogs, activeUser, activeWorkspace],
  );

  // Update Stock Delta
  const updateStock = useCallback(
    async (productId: string, delta: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const currentStock = product.current_stock ?? 0;
      const newStock = Math.max(0, Number((currentStock + delta).toFixed(2)));
      const now = new Date().toISOString();

      const updatedProduct: Product = {
        ...product,
        current_stock: newStock,
        updated_at: now,
        updated_by: activeUser.name,
      };

      const changeStr =
        delta > 0 ? `+${delta} ${product.unit}` : `${delta} ${product.unit}`;
      const activityItem: ActivityLog = {
        id: "act_" + Date.now(),
        action_type: "STOCK_UPDATE",
        title: `${product.name} stock changed`,
        description: `${changeStr} (Now: ${newStock} ${product.unit}) by ${activeUser.name}`,
        user_name: activeUser.name,
        created_at: now,
      };

      const newProducts = products.map((p) =>
        p.id === productId ? updatedProduct : p,
      );
      const newLogs = [activityItem, ...activityLogs];

      setProducts(newProducts);
      setActivityLogs(newLogs);

      await syncService.broadcastStockUpdate(
        updatedProduct,
        activityItem,
        newProducts,
        newLogs,
      );
    },
    [products, activityLogs, activeUser],
  );

  // Set stock direct
  const setStockDirect = useCallback(
    async (productId: string, newStock: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const now = new Date().toISOString();
      const updatedProduct: Product = {
        ...product,
        current_stock: Math.max(0, newStock),
        updated_at: now,
        updated_by: activeUser.name,
      };

      const activityItem: ActivityLog = {
        id: "act_" + Date.now(),
        action_type: "STOCK_UPDATE",
        title: `${product.name} stock set`,
        description: `Set to ${newStock} ${product.unit} by ${activeUser.name}`,
        user_name: activeUser.name,
        created_at: now,
      };

      const newProducts = products.map((p) =>
        p.id === productId ? updatedProduct : p,
      );
      const newLogs = [activityItem, ...activityLogs];

      setProducts(newProducts);
      setActivityLogs(newLogs);

      await syncService.broadcastStockUpdate(
        updatedProduct,
        activityItem,
        newProducts,
        newLogs,
      );
    },
    [products, activityLogs, activeUser],
  );

  // Add Multiple Products (Batch)
  const addProducts = useCallback(
    async (
      productsData: Omit<Product, "id" | "updated_at" | "updated_by">[],
    ) => {
      if (productsData.length === 0) return;
      const now = new Date().toISOString();
      const baseTime = Date.now();
      const newProductsList: Product[] = productsData.map((data, index) => ({
        ...data,
        id:
          "prod_" +
          (baseTime + index) +
          "_" +
          Math.random().toString(36).substring(2, 6),
        workspace_id: activeWorkspace?.id,
        updated_at: now,
        updated_by: activeUser.name,
      }));

      const newLogsList: ActivityLog[] = newProductsList.map((p, index) => ({
        id:
          "act_" +
          (baseTime + index) +
          "_" +
          Math.random().toString(36).substring(2, 6),
        action_type: "PRODUCT_ADD" as const,
        title: `New product added: ${p.name} (${p.unit})`,
        description: `Price: ₹${p.selling_price} per ${p.unit}`,
        user_name: activeUser.name,
        created_at: now,
      }));

      const updatedProducts = [...newProductsList, ...products];
      const updatedLogs = [...newLogsList, ...activityLogs];

      setProducts(updatedProducts);
      setActivityLogs(updatedLogs);

      for (let i = 0; i < newProductsList.length; i++) {
        await syncService.broadcastProductAdd(
          newProductsList[i],
          newLogsList[i],
          updatedProducts,
          updatedLogs,
        );
      }
    },
    [products, activityLogs, activeUser, activeWorkspace],
  );

  // Add Product
  const addProduct = useCallback(
    async (productData: Omit<Product, "id" | "updated_at" | "updated_by">) => {
      await addProducts([productData]);
    },
    [addProducts],
  );

  // Edit Product
  const editProduct = useCallback(
    async (product: Product) => {
      const now = new Date().toISOString();
      const updated: Product = {
        ...product,
        updated_at: now,
        updated_by: activeUser.name,
      };

      const newProducts = products.map((p) =>
        p.id === product.id ? updated : p,
      );
      setProducts(newProducts);
      await syncService.broadcastStockUpdate(
        updated,
        {
          id: "act_" + Date.now(),
          action_type: "PRODUCT_ADD",
          title: `Product details updated: ${product.name}`,
          description: `Updated by ${activeUser.name}`,
          user_name: activeUser.name,
          created_at: now,
        },
        newProducts,
        activityLogs,
      );
    },
    [products, activityLogs, activeUser],
  );

  // Delete Product
  const deleteProduct = useCallback(
    async (productId: string) => {
      const target = products.find((p) => p.id === productId);
      if (!target) return;

      const newProducts = products.filter((p) => p.id !== productId);
      const activityItem: ActivityLog = {
        id: "act_" + Date.now(),
        action_type: "PRODUCT_DELETE",
        title: `Product removed: ${target.name}`,
        description: `Removed by ${activeUser.name}`,
        user_name: activeUser.name,
        created_at: new Date().toISOString(),
      };
      const newLogs = [activityItem, ...activityLogs];

      setProducts(newProducts);
      setActivityLogs(newLogs);
      await saveProducts(newProducts);
      await saveActivityLogs(newLogs);

      try {
        await deleteProductFromNeon(productId);
        await insertActivityLogToNeon(activityItem);
      } catch (err) {
        console.warn("Failed to delete product from Neon DB:", err);
      }
    },
    [products, activityLogs, activeUser],
  );

  // Switch User Profile (e.g. Ramesh <-> Suresh)
  const switchUser = useCallback(async (user: UserProfile) => {
    setActiveUser(user);
    await saveActiveUser(user);
  }, []);

  // Add new user / staff member
  const addNewUser = useCallback(
    async (name: string, role: "Admin" | "Manager" | "Staff") => {
      const colors = ["#059669", "#D97706", "#DC2626", "#0891B2", "#4F46E5"];
      const randomColor = colors[users.length % colors.length];
      const newUser: UserProfile = {
        id: "user_" + Date.now(),
        name,
        role,
        shortName: name.split(" ")[0],
        color: randomColor,
      };
      const newUsers = [...users, newUser];
      setUsers(newUsers);
      await saveUsers(newUsers);
    },
    [users],
  );

  // Connect Supabase Cloud
  const connectSupabase = useCallback(
    async (config: SupabaseConfig) => {
      const testResult = await testSupabaseConnection(config);
      if (!testResult.success) {
        return testResult;
      }

      await saveSupabaseConfig(config);
      await syncService.setupSupabaseRealtime(
        activeUser.name,
        (remoteProduct) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === remoteProduct.id ? remoteProduct : p)),
          );
        },
        (remoteHistory) => {
          setPriceHistory((prev) => [remoteHistory, ...prev]);
        },
      );

      return {
        success: true,
        message: "Connected to Supabase cloud successfully!",
      };
    },
    [activeUser],
  );

  // Disconnect Supabase Cloud
  const disconnectSupabase = useCallback(async () => {
    await clearSupabaseConfig();
    syncService.setStatus("local");
  }, []);

  // Reset to demo data
  const resetData = useCallback(async () => {
    const data = await resetToDefaultData();
    setProducts(data.products);
    setPriceHistory(data.priceHistory);
    setActivityLogs(data.activityLogs);
  }, []);

  // Get price history for specific product
  const getProductHistory = useCallback(
    (productId: string): PriceHistory[] => {
      return priceHistory.filter((h) => h.product_id === productId);
    },
    [priceHistory],
  );

  const value: StoreContextValue = {
    products,
    priceHistory,
    activityLogs,
    users,
    activeUser,
    syncStatus,
    currentNotification,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    updatePrice,
    updateStock,
    setStockDirect,
    addProduct,
    addProducts,
    editProduct,
    deleteProduct,
    switchUser,
    addNewUser,
    dismissNotification,
    connectSupabase,
    disconnectSupabase,
    resetData,
    getProductHistory,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
