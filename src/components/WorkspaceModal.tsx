import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import { getWorkspaceMembers } from "../services/workspaceService";
import { WorkspaceMember } from "../types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenStoreSetup: () => void;
}

export const WorkspaceModal: React.FC<Props> = ({
  visible,
  onClose,
  onOpenStoreSetup,
}) => {
  const { currentUser, activeWorkspace, handleLogout } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (activeWorkspace) {
        const mems = await getWorkspaceMembers(activeWorkspace.id);
        setMembers(mems);
      }
    }
    if (visible) {
      load();
    }
  }, [visible, activeWorkspace]);

  if (!activeWorkspace) return null;

  const handleCopyCode = () => {
    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard
    ) {
      navigator.clipboard.writeText(activeWorkspace.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      Alert.alert(
        "Store Code Copied",
        `Invite Code: ${activeWorkspace.joinCode}`,
      );
    }
  };

  const handleShareInviteWhatsApp = async () => {
    const text = `🏪 Hey team, join our store "*${activeWorkspace.name}*" on Kirana to manage prices together!\n\n🔑 Store Invite Code: *${activeWorkspace.joinCode}*\n\nEnter this code in your app to collaborate.`;
    const encoded = encodeURIComponent(text);
    const url = `whatsapp://send?text=${encoded}`;
    const webUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      handleCopyCode();
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
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>STORE WORKSPACE</Text>
              <Text style={styles.storeName}>{activeWorkspace.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Shareable Invite Code Card */}
            <View style={styles.codeCard}>
              <Text style={styles.codeCardLabel}>STORE INVITE CODE</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{activeWorkspace.joinCode}</Text>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={handleCopyCode}
                >
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={16}
                    color={copied ? Colors.primary : Colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      copied && { color: Colors.primary },
                    ]}
                  >
                    {copied ? "Copied" : "Copy Code"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.codeHint}>
                Share this code with your store partner or staff so they can
                join this store from their phone.
              </Text>

              {/* WhatsApp Invite Button */}
              <TouchableOpacity
                style={styles.whatsappInviteBtn}
                onPress={handleShareInviteWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappInviteText}>
                  Send Store Invite via WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            {/* Members Directory */}
            <Text style={styles.sectionTitle}>
              STORE MEMBERS ({members.length})
            </Text>
            <View style={styles.membersList}>
              {members.map((mem) => {
                const isCurrent = mem.userId === currentUser?.id;
                return (
                  <View key={mem.id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {mem.userName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{mem.userName}</Text>
                        {isCurrent && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>YOU</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberRole}>
                        Role: {mem.role} • Active
                      </Text>
                    </View>
                    <View style={styles.statusDot} />
                  </View>
                );
              })}
            </View>

            {/* Switch / Create Store Option */}
            <TouchableOpacity
              style={styles.switchStoreBtn}
              onPress={() => {
                onClose();
                onOpenStoreSetup();
              }}
            >
              <Ionicons
                name="swap-horizontal"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.switchStoreText}>
                Switch or Join Another Store
              </Text>
            </TouchableOpacity>

            {/* Current User & Logout */}
            <View style={styles.userFooter}>
              <View style={styles.userFootInfo}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={Colors.textMuted}
                />
                <Text style={styles.userFootText}>
                  Logged in as{" "}
                  <Text style={styles.boldText}>{currentUser?.name}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  onClose();
                  await handleLogout();
                }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={16}
                  color={Colors.danger}
                />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>Close Store Details</Text>
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
  modalSheet: {
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  codeCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 20,
  },
  codeCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#166534",
    letterSpacing: 0.8,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 6,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.primaryDark,
    letterSpacing: 1.5,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  codeHint: {
    fontSize: 12,
    color: "#166534",
    lineHeight: 16,
    marginBottom: 12,
  },
  whatsappInviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  whatsappInviteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  membersList: {
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  memberAvatarText: {
    color: Colors.primaryDark,
    fontWeight: "800",
    fontSize: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  youBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2563EB",
  },
  memberRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  switchStoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 16,
  },
  switchStoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  userFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  userFootInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userFootText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  boldText: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 4,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.danger,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeActionBtn: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  closeActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
});
