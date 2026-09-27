import * as React from "react";
import { useState, useEffect } from "react";
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
import { Product } from "../types";
import { useStore } from "../context/StoreContext";
import { Colors } from "../theme/colors";

interface Props {
  product: Product | null; // null means Add New, otherwise Edit Existing
  visible: boolean;
  onClose: () => void;
}

interface VariantItem {
  id: string;
  unit: string;
  sellingPrice: string;
}

const COMMON_UNITS = [
  "kg",
  "500g",
  "250g",
  "100g",
  "1L",
  "500ml",
  "pkt",
  "pc",
  "bag",
  "box",
];

export const ProductFormModal: React.FC<Props> = ({
  product,
  visible,
  onClose,
}) => {
  const { addProduct, editProduct } = useStore();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [variants, setVariants] = useState<VariantItem[]>([
    { id: "var_init", unit: "1kg", sellingPrice: "" },
  ]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBrand(product.brand || "");
      if (product.variants && product.variants.length > 0) {
        setVariants(
          product.variants.map((v) => ({
            id: v.id,
            unit: v.unit,
            sellingPrice: v.selling_price.toString(),
          })),
        );
      } else {
        setVariants([
          {
            id: "var_edit_" + product.id,
            unit: product.unit,
            sellingPrice: product.selling_price.toString(),
          },
        ]);
      }
    } else {
      setName("");
      setBrand("");
      setVariants([
        {
          id: "var_init_" + Date.now(),
          unit: "1kg",
          sellingPrice: "",
        },
      ]);
    }
    setErrorMsg("");
  }, [product, visible]);

  const handleAddVariant = () => {
    const usedUnits = new Set(variants.map((v) => v.unit));
    const nextUnit = COMMON_UNITS.find((u) => !usedUnits.has(u)) || "";
    setVariants((prev) => [
      ...prev,
      {
        id:
          "var_" +
          Date.now() +
          "_" +
          Math.random().toString(36).substring(2, 6),
        unit: nextUnit,
        sellingPrice: "",
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateUnit = (id: string, unit: string) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, unit } : v)));
  };

  const handleUpdatePrice = (id: string, sellingPrice: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, sellingPrice } : v)),
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg("Please enter product name");
      return;
    }

    if (variants.length === 0) {
      setErrorMsg("Please add at least one unit and selling price");
      return;
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.unit.trim()) {
        setErrorMsg(
          variants.length > 1
            ? `Please enter unit for pack size #${i + 1}`
            : "Please enter product unit",
        );
        return;
      }
      const price = parseFloat(v.sellingPrice);
      if (isNaN(price) || price <= 0) {
        setErrorMsg(
          variants.length > 1
            ? `Please enter a valid selling price for ${v.unit} (size #${i + 1})`
            : "Please enter a valid selling price",
        );
        return;
      }
    }

    const parsedVariants = variants.map((v, idx) => ({
      id: v.id || `var_${Date.now()}_${idx}`,
      unit: v.unit.trim(),
      selling_price: parseFloat(v.sellingPrice) || 0,
    }));

    const primaryUnit = parsedVariants[0].unit;
    const primaryPrice = parsedVariants[0].selling_price;

    if (product) {
      // Edit existing product with all its pack sizes / variants
      await editProduct({
        ...product,
        name: name.trim(),
        category: product.category || "General",
        brand: brand.trim() || undefined,
        unit: primaryUnit,
        selling_price: primaryPrice,
        variants: parsedVariants,
      });
    } else {
      // Add one new product with all its variants
      await addProduct({
        name: name.trim(),
        category: "General",
        brand: brand.trim() || undefined,
        unit: primaryUnit,
        purchase_price: 0,
        selling_price: primaryPrice,
        variants: parsedVariants,
      });
    }

    onClose();
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
        <View style={styles.modalSheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {product ? "Edit Product Details" : "Add New Kirana Product"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Name */}
            <Text style={styles.inputLabel}>PRODUCT NAME *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Aashirvaad Shudh Chakki Atta"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Brand */}
            <Text style={styles.inputLabel}>BRAND</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. ITC, Amul, Tata, Nestle..."
              placeholderTextColor={Colors.textMuted}
              value={brand}
              onChangeText={setBrand}
            />

            {/* Variants Section: Unit & Price Side by Side */}
            <View style={styles.variantsSectionHeader}>
              <Text style={styles.sectionHeaderTitle}>
                PACK SIZES & SELLING PRICES
              </Text>
              {variants.length > 1 && (
                <View style={styles.variantCountPill}>
                  <Text style={styles.variantCountText}>
                    {variants.length} Sizes
                  </Text>
                </View>
              )}
            </View>

            {variants.map((item, index) => (
              <View key={item.id} style={styles.variantCard}>
                {variants.length > 1 && (
                  <View style={styles.variantCardHeader}>
                    <View style={styles.variantBadge}>
                      <Ionicons
                        name="pricetag"
                        size={12}
                        color={Colors.primary}
                      />
                      <Text style={styles.variantBadgeText}>
                        SIZE #{index + 1}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeVariantBtn}
                      onPress={() => handleRemoveVariant(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={13}
                        color={Colors.danger}
                      />
                      <Text style={styles.removeVariantText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Unit & Selling Price Side by Side */}
                <View style={styles.rowTwoCols}>
                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>
                      UNIT (KG, PACKET, ETC.) *
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 500g"
                      placeholderTextColor={Colors.textMuted}
                      value={item.unit}
                      onChangeText={(val) => handleUpdateUnit(item.id, val)}
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={styles.inputLabel}>SELLING PRICE (₹) *</Text>
                    <TextInput
                      style={[styles.textInput, styles.highlightInput]}
                      placeholder="0.00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={item.sellingPrice}
                      onChangeText={(val) => handleUpdatePrice(item.id, val)}
                    />
                  </View>
                </View>

                {/* Quick Unit Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.unitChipsRow}
                >
                  {COMMON_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitChip,
                        item.unit === u && styles.unitChipActive,
                      ]}
                      onPress={() => handleUpdateUnit(item.id, u)}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          item.unit === u && styles.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}

            {/* Add Another Variant Button */}
            <TouchableOpacity
              style={styles.addVariantBtn}
              onPress={handleAddVariant}
            >
              <Text style={styles.addVariantBtnText}>
                + Add Another Unit & Price
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {product
                  ? variants.length > 1
                    ? `Save & Add ${variants.length - 1} Variant${variants.length > 2 ? "s" : ""}`
                    : "Save Product Details"
                  : variants.length > 1
                    ? `Add ${variants.length} Pack Sizes to Store`
                    : "Add to Store Catalog"}
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
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  highlightInput: {
    borderColor: Colors.primary,
    fontWeight: "800",
    color: Colors.primary,
  },
  categoryPillsRow: {
    gap: 8,
    marginBottom: 14,
    paddingBottom: 2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  unitInputRow: {
    marginBottom: 8,
  },
  unitChipsRow: {
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unitChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  unitChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  variantsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  variantCountPill: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  variantCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  variantCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  variantCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  variantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  variantBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  removeVariantBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeVariantText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.danger,
  },
  addVariantBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    backgroundColor: "#F0FDF4",
    marginBottom: 16,
  },
  addVariantBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
