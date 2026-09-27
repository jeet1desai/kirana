import * as React from "react";
import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import { Product, ProductVariant } from "../types";

import { Header } from "../components/Header";
import { SearchAndFilter } from "../components/SearchAndFilter";
import { ProductCard } from "../components/ProductCard";
import { PriceEditModal } from "../components/PriceEditModal";
import { PriceHistoryModal } from "../components/PriceHistoryModal";
import { ProductFormModal } from "../components/ProductFormModal";
import { ActivityLogModal } from "../components/ActivityLogModal";
import { SyncNotificationToast } from "../components/SyncNotificationToast";
import { WorkspaceModal } from "../components/WorkspaceModal";
import { WorkspaceSetupScreen } from "./WorkspaceSetupScreen";

export const HomeScreen: React.FC = () => {
  const {
    products,
    searchQuery,
    currentNotification,
    dismissNotification,
    refreshData,
  } = useStore();
  const { refreshWorkspaces } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), refreshWorkspaces()]);
    } catch (err) {
      console.warn("Pull to refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Modals state
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<{
    product: Product;
    variant?: ProductVariant;
  } | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const brandMatch = p.brand ? p.brand.toLowerCase().includes(q) : false;
      const barcodeMatch = p.barcode ? p.barcode.includes(q) : false;
      return nameMatch || brandMatch || barcodeMatch;
    });
  }, [products, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Real-Time Sync Notification Toast */}
      <SyncNotificationToast
        notification={currentNotification}
        onDismiss={dismissNotification}
      />

      {/* App Header with Store Name, Code Pill, Actions */}
      <Header
        onOpenActivityLog={() => setShowActivityLog(true)}
        onOpenAddProduct={() => setShowAddModal(true)}
        onOpenWorkspaceModal={() => setShowWorkspaceModal(true)}
      />

      {/* Instant Search Bar & Category Scroll */}
      <SearchAndFilter />

      {/* Main Content Area */}
      <View style={styles.container}>
        {/* Product List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onEditPrice={(p, v) =>
                setSelectedProductForPrice({ product: p, variant: v })
              }
              onViewHistory={(p) => setSelectedProductForHistory(p)}
              onEditProduct={(p) => setSelectedProductForEdit(p)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.resultsBar}>
              <Text style={styles.resultsText}>
                Showing{" "}
                <Text style={styles.boldText}>{filteredProducts.length}</Text>{" "}
                of {products.length} Products
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No Matching Products Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No items found matching "${searchQuery}". Check spelling or search by brand (Amul, Tata, etc.).`
                  : "No products added yet."}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add New Product</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Floating Quick Action Button */}
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setShowAddModal(true)}
          accessibilityLabel="Add Product"
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <PriceEditModal
        product={selectedProductForPrice?.product || null}
        selectedVariant={selectedProductForPrice?.variant}
        visible={!!selectedProductForPrice}
        onClose={() => setSelectedProductForPrice(null)}
      />

      <PriceHistoryModal
        product={selectedProductForHistory}
        visible={!!selectedProductForHistory}
        onClose={() => setSelectedProductForHistory(null)}
      />

      <ProductFormModal
        product={selectedProductForEdit}
        visible={!!selectedProductForEdit || showAddModal}
        onClose={() => {
          setSelectedProductForEdit(null);
          setShowAddModal(false);
        }}
      />

      <ActivityLogModal
        visible={showActivityLog}
        onClose={() => setShowActivityLog(false)}
      />

      <WorkspaceModal
        visible={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        onOpenStoreSetup={() => setShowSetupModal(true)}
      />

      {/* Switch / Create Store Screen Modal */}
      <Modal
        visible={showSetupModal}
        animationType="slide"
        onRequestClose={() => setShowSetupModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowSetupModal(false)}
              style={{ padding: 8 }}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <WorkspaceSetupScreen />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  resultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  resultsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  boldText: {
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 18,
    gap: 6,
  },
  emptyAddBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fabBtn: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#047857",
  },
});
