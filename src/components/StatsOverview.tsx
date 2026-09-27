import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../context/StoreContext";
import { Colors } from "../theme/colors";

interface Props {}

export const StatsOverview: React.FC<Props> = () => {
  const { products, priceHistory } = useStore();

  // Calculate stats
  const totalProducts = products.length;

  // Price updates made today
  const todayDateString = new Date().toDateString();
  const updatesTodayCount = priceHistory.filter((h) => {
    return new Date(h.created_at).toDateString() === todayDateString;
  }).length;

  // Average profit margin %
  let totalMarginSum = 0;
  let validMarginCount = 0;
  products.forEach((p) => {
    if (p.selling_price > 0 && p.purchase_price > 0) {
      const margin =
        ((p.selling_price - p.purchase_price) / p.selling_price) * 100;
      totalMarginSum += margin;
      validMarginCount++;
    }
  });
  const avgMargin =
    validMarginCount > 0 ? (totalMarginSum / validMarginCount).toFixed(1) : "0";

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Total Products Card */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#E0F2FE" }]}>
            <Ionicons name="cube-outline" size={18} color="#0284C7" />
          </View>
          <View>
            <Text style={styles.cardValue}>{totalProducts}</Text>
            <Text style={styles.cardLabel}>Catalog Items</Text>
          </View>
        </View>

        {/* Price Changes Today Card */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons
              name="trending-up-outline"
              size={18}
              color={Colors.primary}
            />
          </View>
          <View>
            <Text style={[styles.cardValue, { color: Colors.primary }]}>
              {updatesTodayCount}
            </Text>
            <Text style={styles.cardLabel}>Price Hikes Today</Text>
          </View>
        </View>

        {/* Average Margin Card */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#EDE9FE" }]}>
            <Ionicons name="pie-chart-outline" size={18} color="#7C3AED" />
          </View>
          <View>
            <Text style={[styles.cardValue, { color: "#7C3AED" }]}>
              {avgMargin}%
            </Text>
            <Text style={styles.cardLabel}>Avg Profit Margin</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
    gap: 10,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardAlert: {
    borderColor: "#FECACA",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  cardLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});
