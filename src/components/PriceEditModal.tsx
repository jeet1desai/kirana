import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, ProductVariant } from "../types";
import { useStore } from "../context/StoreContext";
import { Colors } from "../theme/colors";

interface Props {
  product: Product | null;
  selectedVariant?: ProductVariant;
  visible: boolean;
  onClose: () => void;
}

export const PriceEditModal: React.FC<Props> = ({
  product,
  selectedVariant,
  visible,
  onClose,
}) => {
  const { updatePrice, activeUser } = useStore();

  const variants: ProductVariant[] = useMemo(() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) {
      return product.variants;
    }
    return [
      {
        id: product.id + "_default",
        unit: product.unit,
        selling_price: product.selling_price,
      },
    ];
  }, [product]);

  const [activeVariantId, setActiveVariantId] = useState<string>("");
  const [newPriceStr, setNewPriceStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product && variants.length > 0) {
      const initialVariant =
        variants.find((v) => v.id === selectedVariant?.id) || variants[0];
      setActiveVariantId(initialVariant.id);
      setNewPriceStr(initialVariant.selling_price.toString());
    }
  }, [product, selectedVariant, visible, variants]);

  if (!product) return null;

  const activeVariant = variants.find((v) => v.id === activeVariantId) ||
    variants[0] || {
      id: "default",
      unit: product.unit,
      selling_price: product.selling_price,
    };

  const currentPrice = activeVariant.selling_price;
  const currentUnit = activeVariant.unit;
  const parsedNewPrice = parseFloat(newPriceStr) || 0;
  const priceDelta = parsedNewPrice - currentPrice;
  const costPrice = product.purchase_price || 0;
  const hasCostPrice = costPrice > 0;
  const newMarginAmt = parsedNewPrice - costPrice;
  const newMarginPercent =
    parsedNewPrice > 0
      ? ((newMarginAmt / parsedNewPrice) * 100).toFixed(1)
      : "0";

  const handleSelectVariant = (v: ProductVariant) => {
    setActiveVariantId(v.id);
    setNewPriceStr(v.selling_price.toString());
  };

  const handleApplyDelta = (delta: number) => {
    const nextVal = Math.max(0, (parsedNewPrice || currentPrice) + delta);
    setNewPriceStr(nextVal.toString());
  };

  const handleSave = async () => {
    if (parsedNewPrice <= 0) return;
    setIsSubmitting(true);
    try {
      const reason = `Price updated for ${currentUnit}`;
      await updatePrice(product.id, parsedNewPrice, reason, activeVariant.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.indicator} />
            <View style={styles.titleRow}>
              <View style={styles.titleTextContainer}>
                <Text style={styles.sheetSubtitle}>PRICE UPDATE</Text>
                <Text
                  style={styles.sheetTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {product.name}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pack Size Switcher (if multiple variants) */}
          {variants.length > 1 && (
            <View style={styles.variantTabsSection}>
              <Text style={styles.variantTabsLabel}>
                SELECT PACK SIZE TO UPDATE
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantTabsRow}
              >
                {variants.map((v) => {
                  const isSelected = v.id === activeVariant.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.variantTab,
                        isSelected && styles.variantTabSelected,
                      ]}
                      onPress={() => handleSelectVariant(v)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.variantTabText,
                          isSelected && styles.variantTabTextSelected,
                        ]}
                      >
                        {v.unit}
                      </Text>
                      <Text
                        style={[
                          styles.variantTabPrice,
                          isSelected && styles.variantTabPriceSelected,
                        ]}
                      >
                        ₹{v.selling_price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current vs New Price Comparison Card */}
            <View style={styles.comparisonCard}>
              <View style={styles.priceColumn}>
                <Text style={styles.priceColumnLabel}>CURRENT PRICE</Text>
                <Text style={styles.currentPriceText}>₹{currentPrice}</Text>
                <Text style={styles.unitText}>per {currentUnit}</Text>
              </View>

              <View style={styles.arrowBox}>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={Colors.primary}
                />
                {priceDelta !== 0 && (
                  <View
                    style={[
                      styles.deltaBadge,
                      {
                        backgroundColor: priceDelta > 0 ? "#D1FAE5" : "#FEE2E2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deltaText,
                        {
                          color:
                            priceDelta > 0 ? Colors.primaryDark : Colors.danger,
                        },
                      ]}
                    >
                      {priceDelta > 0
                        ? `+₹${priceDelta}`
                        : `-₹${Math.abs(priceDelta)}`}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.priceColumn}>
                <Text style={styles.priceColumnLabel}>NEW PRICE (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    value={newPriceStr}
                    onChangeText={setNewPriceStr}
                    selectTextOnFocus
                    autoFocus
                  />
                </View>
                {hasCostPrice ? (
                  <Text style={styles.unitText}>Cost: ₹{costPrice}</Text>
                ) : (
                  <Text style={styles.unitText}>for {currentUnit}</Text>
                )}
              </View>
            </View>

            {/* Quick Adjustment Chips */}
            <Text style={styles.sectionLabel}>QUICK PRICE ADJUSTMENTS</Text>
            <View style={styles.chipsRow}>
              {[
                { label: "+₹5", delta: 5 },
                { label: "+₹10", delta: 10 },
                { label: "+₹25", delta: 25 },
                { label: "-₹5", delta: -5 },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.label}
                  style={styles.adjustChip}
                  onPress={() => handleApplyDelta(chip.delta)}
                >
                  <Text style={styles.adjustChipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Margin Preview only if purchase cost is tracked */}
            {hasCostPrice && (
              <View style={styles.marginPreviewBox}>
                <View style={styles.marginPreviewRow}>
                  <Text style={styles.marginPreviewLabel}>
                    Projected Profit Margin:
                  </Text>
                  <Text style={styles.marginPreviewValue}>
                    ₹{newMarginAmt.toFixed(2)} ({newMarginPercent}%)
                  </Text>
                </View>
                <Text style={styles.marginPreviewSub}>
                  Purchase Cost: ₹{costPrice} • Profit per {currentUnit}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (parsedNewPrice <= 0 || isSubmitting) &&
                  styles.submitBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={parsedNewPrice <= 0 || isSubmitting}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? "Updating..."
                  : variants.length > 1
                    ? `Update ${currentUnit} to ₹${parsedNewPrice}`
                    : `Update to ₹${parsedNewPrice}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  titleTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  sheetSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginTop: 2,
    flexShrink: 1,
  },
  closeBtn: {
    padding: 6,
    flexShrink: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  comparisonCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  priceColumn: {
    alignItems: "center",
    flex: 1,
  },
  priceColumnLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    marginBottom: 4,
  },
  currentPriceText: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textSecondary,
  },
  unitText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  arrowBox: {
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 4,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: "800",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 90,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primary,
    marginRight: 2,
  },
  priceInput: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.textPrimary,
    minWidth: 50,
    padding: 0,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  adjustChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  adjustChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  marginPreviewBox: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  marginPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marginPreviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  marginPreviewValue: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primaryDark,
  },
  marginPreviewSub: {
    fontSize: 11,
    color: "#065F46",
    marginTop: 3,
  },

  boldText: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  variantTabsSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: "#F8FAFC",
  },
  variantTabsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  variantTabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 8,
  },
  variantTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    minWidth: 70,
  },
  variantTabSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#ECFDF5",
  },
  variantTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  variantTabTextSelected: {
    color: Colors.primary,
  },
  variantTabPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  variantTabPriceSelected: {
    color: Colors.primaryDark,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
