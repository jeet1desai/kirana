import * as React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

interface Props {
  onOpenActivityLog: () => void;
  onOpenAddProduct: () => void;
  onOpenWorkspaceModal: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenActivityLog,
  onOpenAddProduct,
  onOpenWorkspaceModal,
}) => {
  const { activeWorkspace, currentUser } = useAuth();

  const storeName = activeWorkspace?.name || "Apna Kirana Store";
  const joinCode = activeWorkspace?.joinCode || "APNA-2026";

  return (
    <View style={styles.headerContainer}>
      {/* Top row: Store Name + Store Code + Quick Actions */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.branding}
          onPress={onOpenWorkspaceModal}
          activeOpacity={0.8}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="storefront" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.storeInfo}>
            <View style={styles.titleRow}>
              <Text
                style={styles.storeName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {storeName}
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color={Colors.textMuted}
              />
            </View>
            {/* Store Code Pill */}
            <View style={styles.codePillRow}>
              <View style={styles.codePill}>
                <Ionicons
                  name="key-outline"
                  size={10}
                  color={Colors.primaryDark}
                />
                <Text style={styles.codePillText}>Code: {joinCode}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action icons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={onOpenActivityLog}
            accessibilityLabel="Activity Log"
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          {/* User Profile Avatar / Workspace Toggle */}
          <TouchableOpacity
            style={[
              styles.userAvatarBtn,
              { backgroundColor: currentUser?.avatarColor || Colors.primary },
            ]}
            onPress={onOpenWorkspaceModal}
            accessibilityLabel="Store Members & Settings"
          >
            <Text style={styles.userAvatarText}>
              {currentUser?.name
                ? currentUser.name.charAt(0).toUpperCase()
                : "R"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addProductBtn}
            onPress={onOpenAddProduct}
            accessibilityLabel="Add New Product"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addProductText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  branding: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  storeInfo: {
    flex: 1,
    minWidth: 0,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
  },
  storeName: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  codePillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  codePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  addProductBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  addProductText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
});
