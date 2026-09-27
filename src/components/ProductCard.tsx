import * as React from "react";
import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, ProductVariant } from "../types";
import { Colors } from "../theme/colors";

interface Props {
  product: Product;
  onEditPrice: (product: Product, variant?: ProductVariant) => void;
  onViewHistory: (product: Product) => void;
  onEditProduct: (product: Product) => void;
}

export const ProductCard: React.FC<Props> = ({
  product,
  onEditPrice,
  onViewHistory,
  onEditProduct,
}) => {
  const variants: ProductVariant[] =
    product.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            id: product.id + "_default",
            unit: product.unit,
            selling_price: product.selling_price,
          },
        ];

  const hasMultipleVariants = variants.length > 1;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const safeIndex =
    selectedVariantIndex < variants.length ? selectedVariantIndex : 0;
  const currentVariant = variants[safeIndex];

  // Format relative timestamp
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffHours = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return "";
    }
  };

  const updatedTime = getRelativeTime(product.updated_at);

  return (
    <View style={styles.card}>
      {/* Top Header: Brand & Unit Badges + Edit details */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {product.brand ? (
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{product.brand}</Text>
            </View>
          ) : null}

          {hasMultipleVariants ? (
            <View style={styles.multiBadge}>
              <Ionicons name="layers" size={11} color={Colors.primary} />
              <Text style={styles.multiBadgeText}>
                {variants.length} PACK SIZES
              </Text>
            </View>
          ) : (
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>{currentVariant.unit}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onEditProduct(product)}
          style={styles.moreBtn}
          accessibilityLabel="Edit product info"
        >
          <Ionicons name="create" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Product Title */}
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>

      {/* Pricing Section: Multiple Units vs Single Unit */}
      {hasMultipleVariants ? (
        <View style={styles.multiVariantsSection}>
          <Text style={styles.multiVariantsLabel}>PACK SIZES & PRICES</Text>
          <View style={styles.variantsGrid}>
            {variants.map((v, idx) => {
              const isSelected = safeIndex === idx;
              return (
                <TouchableOpacity
                  key={v.id || idx}
                  style={[
                    styles.variantCardItem,
                    isSelected && styles.variantCardItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedVariantIndex(idx);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.variantUnitPill,
                      isSelected && styles.variantUnitPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.variantUnitText,
                        isSelected && styles.variantUnitTextSelected,
                      ]}
                    >
                      {v.unit}
                    </Text>
                  </View>
                  <View style={styles.variantPriceRow}>
                    <Text
                      style={[
                        styles.variantCurrencySymbol,
                        isSelected && styles.variantCurrencySymbolSelected,
                      ]}
                    >
                      ₹
                    </Text>
                    <Text
                      style={[
                        styles.variantPriceNumber,
                        isSelected && styles.variantPriceNumberSelected,
                      ]}
                    >
                      {v.selling_price}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.priceSection}>
          <TouchableOpacity
            style={styles.sellingPriceBox}
            onPress={() => onEditPrice(product, currentVariant)}
            activeOpacity={0.7}
          >
            <Text style={styles.sellingPriceLabel}>Selling Price</Text>
            <View style={styles.sellingPriceValueRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.sellingPriceValue}>
                {currentVariant.selling_price}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer: User Attribution + Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.attributionBox}>
          <Ionicons
            name="person-circle-outline"
            size={14}
            color={Colors.textMuted}
          />
          <Text style={styles.attributionText} numberOfLines={1}>
            {product.updated_by} • {updatedTime}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          {/* History Button */}
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => onViewHistory(product)}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Quick Update Price Button */}
          <TouchableOpacity
            style={styles.updatePriceBtn}
            onPress={() => onEditPrice(product, currentVariant)}
          >
            <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
            <Text style={styles.updatePriceBtnText}>
              {hasMultipleVariants
                ? `Update (${currentVariant.unit})`
                : "Update"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  brandBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563EB",
    textTransform: "uppercase",
  },
  unitBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  multiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  multiBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  multiVariantsSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  multiVariantsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  variantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantCardItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  variantCardItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0FDF4",
  },
  variantUnitPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  variantUnitPillSelected: {
    backgroundColor: Colors.primary,
  },
  variantUnitText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  variantUnitTextSelected: {
    color: "#FFFFFF",
  },
  variantPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 1,
  },
  variantCurrencySymbol: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  variantCurrencySymbolSelected: {
    color: Colors.primary,
  },
  variantPriceNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  variantPriceNumberSelected: {
    color: Colors.primary,
  },
  categoryBadge: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  moreBtn: {
    padding: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 10,
  },
  sellingPriceBox: {
    flex: 1,
  },
  sellingPriceLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sellingPriceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 1,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
  },
  sellingPriceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  editPriceIcon: {
    marginLeft: 6,
    alignSelf: "center",
  },
  costInfoBox: {
    alignItems: "flex-end",
  },
  costItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  costLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  costValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  marginBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    gap: 3,
  },
  marginText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  attributionBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
    gap: 4,
  },
  attributionText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  updatePriceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  updatePriceBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
