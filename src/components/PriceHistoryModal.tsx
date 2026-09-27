import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, PriceHistory } from "../types";
import { useStore } from "../context/StoreContext";
import { Colors } from "../theme/colors";

interface Props {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
}

export const PriceHistoryModal: React.FC<Props> = ({
  product,
  visible,
  onClose,
}) => {
  const { getProductHistory } = useStore();

  if (!product) return null;

  const historyList: PriceHistory[] = getProductHistory(product.id);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerSubtitle}>PRICE AUDIT TRAIL</Text>
              <Text
                style={styles.productName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {product.name}
              </Text>
              <Text style={styles.currentPriceInfo}>
                Current Price:{" "}
                <Text style={styles.boldPrice}>₹{product.selling_price}</Text> /{" "}
                {product.unit}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Timeline Feed */}
          <ScrollView
            style={styles.historyList}
            contentContainerStyle={styles.scrollContent}
          >
            {historyList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={40}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyTitle}>No Price Revisions Yet</Text>
                <Text style={styles.emptySubtitle}>
                  When any store member updates the price of {product.name}, the
                  complete audit trail will appear here.
                </Text>
              </View>
            ) : (
              historyList.map((item, index) => {
                const delta = item.new_price - item.old_price;
                const isHike = delta >= 0;
                return (
                  <View key={item.id || index} style={styles.timelineItem}>
                    {/* Left timeline indicator */}
                    <View style={styles.timelineIndicatorColumn}>
                      <View
                        style={[
                          styles.timelineDot,
                          {
                            backgroundColor: isHike
                              ? Colors.primary
                              : Colors.danger,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isHike ? "arrow-up" : "arrow-down"}
                          size={10}
                          color="#FFFFFF"
                        />
                      </View>
                      {index < historyList.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>

                    {/* Timeline card content */}
                    <View style={styles.timelineCard}>
                      <View style={styles.priceChangeRow}>
                        <View style={styles.pricesBox}>
                          <Text style={styles.oldPrice}>₹{item.old_price}</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={Colors.textMuted}
                          />
                          <Text style={styles.newPrice}>₹{item.new_price}</Text>
                        </View>
                        <View
                          style={[
                            styles.deltaPill,
                            { backgroundColor: isHike ? "#D1FAE5" : "#FEE2E2" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.deltaPillText,
                              {
                                color: isHike
                                  ? Colors.primaryDark
                                  : Colors.danger,
                              },
                            ]}
                          >
                            {isHike ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                          </Text>
                        </View>
                      </View>

                      {/* Changed By User attribution */}
                      <View style={styles.attributionRow}>
                        <Ionicons
                          name="person-circle"
                          size={14}
                          color="#6366F1"
                        />
                        <Text style={styles.changedByText}>
                          Changed by:{" "}
                          <Text style={styles.boldUser}>{item.changed_by}</Text>
                        </Text>
                      </View>

                      {/* Reason & Date */}
                      {item.reason && (
                        <View style={styles.reasonRow}>
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={12}
                            color={Colors.textMuted}
                          />
                          <Text style={styles.reasonText}>{item.reason}</Text>
                        </View>
                      )}

                      <Text style={styles.dateText}>
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleBox: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: 2,
    flexShrink: 1,
  },
  currentPriceInfo: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  boldPrice: {
    fontWeight: "800",
    color: Colors.primary,
  },
  closeBtn: {
    padding: 6,
    flexShrink: 0,
  },
  historyList: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  timelineIndicatorColumn: {
    alignItems: "center",
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceChangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pricesBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  oldPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textMuted,
    textDecorationLine: "line-through",
  },
  newPrice: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deltaPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  attributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  changedByText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  boldUser: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  doneBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
