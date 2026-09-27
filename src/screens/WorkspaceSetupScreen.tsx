import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

export const WorkspaceSetupScreen: React.FC = () => {
  const {
    currentUser,
    handleCreateWorkspace,
    handleJoinWorkspace,
    handleLogout,
    userWorkspaces,
    handleSwitchWorkspace,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [storeName, setStoreName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const onCreateStore = async () => {
    if (!storeName.trim()) {
      setErrorMsg("Please enter your store name");
      return;
    }
    setErrorMsg("");
    setIsProcessing(true);
    try {
      const res = await handleCreateWorkspace(storeName);
      if (!res.success) {
        setErrorMsg(res.message || "Failed to create store");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const onJoinStore = async () => {
    if (!joinCode.trim()) {
      setErrorMsg("Please enter store invite code");
      return;
    }
    setErrorMsg("");
    setIsProcessing(true);
    try {
      const res = await handleJoinWorkspace(joinCode);
      if (!res.success) {
        setErrorMsg(res.message || "Failed to join store with that code");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Status Bar */}
          <View style={styles.userTopBar}>
            <View style={styles.userInfo}>
              <View
                style={[
                  styles.userAvatar,
                  {
                    backgroundColor: currentUser?.avatarColor || Colors.primary,
                  },
                ]}
              >
                <Text style={styles.userAvatarText}>
                  {currentUser?.name.charAt(0) || "U"}
                </Text>
              </View>
              <View>
                <Text style={styles.greetingText}>Logged in as</Text>
                <Text style={styles.userNameText}>{currentUser?.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons
                name="log-out-outline"
                size={16}
                color={Colors.textMuted}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>Connect to a Store</Text>
            <Text style={styles.headerSubtitle}>
              Join an existing store using an invite code, or create a new store
              workspace.
            </Text>
          </View>

          {/* Existing Workspaces if any */}
          {userWorkspaces.length > 0 && (
            <View style={styles.existingWsBox}>
              <Text style={styles.sectionLabel}>YOUR EXISTING STORES</Text>
              {userWorkspaces.map((ws) => (
                <TouchableOpacity
                  key={ws.id}
                  style={styles.existingWsCard}
                  onPress={() => handleSwitchWorkspace(ws)}
                >
                  <View style={styles.wsIconBox}>
                    <Ionicons
                      name="storefront"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.existingWsContent}>
                    <Text style={styles.existingWsName}>{ws.name}</Text>
                    <Text style={styles.existingWsCode}>
                      Store Code: {ws.joinCode}
                    </Text>
                  </View>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tab Selector: Join Store vs Create Store */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "join" && styles.tabBtnActive,
              ]}
              onPress={() => {
                setActiveTab("join");
                setErrorMsg("");
              }}
            >
              <Ionicons
                name="link"
                size={16}
                color={activeTab === "join" ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "join" && styles.tabBtnTextActive,
                ]}
              >
                Join with Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "create" && styles.tabBtnActive,
              ]}
              onPress={() => {
                setActiveTab("create");
                setErrorMsg("");
              }}
            >
              <Ionicons
                name="add-circle"
                size={16}
                color={
                  activeTab === "create" ? Colors.primary : Colors.textMuted
                }
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "create" && styles.tabBtnTextActive,
                ]}
              >
                Create New Store
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error display */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Tab Content: Join Store */}
          {activeTab === "join" ? (
            <View style={styles.actionCard}>
              <Text style={styles.cardTitle}>Enter Store Invite Code</Text>
              <Text style={styles.cardSubtitle}>
                Ask the store owner or partner for the 6-character code (e.g.
                APNA-2026):
              </Text>

              <TextInput
                style={styles.codeInput}
                placeholder="e.g. APNA-2026"
                placeholderTextColor={Colors.textMuted}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.actionBtn, isProcessing && styles.btnDisabled]}
                onPress={onJoinStore}
                disabled={isProcessing}
              >
                <Ionicons name="enter-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>
                  {isProcessing ? "Connecting..." : "Join Store Workspace"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Tab Content: Create Store */
            <View style={styles.actionCard}>
              <Text style={styles.cardTitle}>Name Your Kirana Store</Text>
              <Text style={styles.cardSubtitle}>
                We will generate an invite code so your partner and staff can
                join immediately:
              </Text>

              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Gupta Provision Store"
                placeholderTextColor={Colors.textMuted}
                value={storeName}
                onChangeText={setStoreName}
              />

              <TouchableOpacity
                style={[styles.actionBtn, isProcessing && styles.btnDisabled]}
                onPress={onCreateStore}
                disabled={isProcessing}
              >
                <Ionicons name="storefront" size={20} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>
                  {isProcessing ? "Creating..." : "Create Store & Get Code"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  userTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  greetingText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 4,
  },
  logoutText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  headerBox: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  existingWsBox: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  existingWsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 12,
  },
  wsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  existingWsContent: {
    flex: 1,
  },
  existingWsName: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  existingWsCode: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 2,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: "600",
    flex: 1,
  },
  actionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  codeInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: "900",
    color: Colors.primary,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  demoHintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  demoHintText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "500",
    flex: 1,
  },
  boldCode: {
    fontWeight: "800",
    color: "#B45309",
  },
});
