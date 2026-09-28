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
  ActivityIndicator,
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Hero Section */}
          <View style={styles.heroSection}>
            {/* Branding Header */}
            <View style={styles.brandingBox}>
              <View style={styles.logoBadge}>
                <Ionicons name="storefront" size={34} color="#FFFFFF" />
              </View>
              <Text style={styles.appTitle}>Connect Store</Text>
              <Text style={styles.appSubtitle}>
                Join an existing store with an invite code, or create a brand
                new workspace.
              </Text>
            </View>

            {/* Existing Workspaces or Feature highlights */}
            {userWorkspaces.length > 0 ? (
              <View style={styles.existingWsBox}>
                <Text style={styles.sectionLabel}>YOUR EXISTING STORES</Text>
                {userWorkspaces.map((ws) => (
                  <TouchableOpacity
                    key={ws.id}
                    style={styles.existingWsCard}
                    onPress={() => handleSwitchWorkspace(ws)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.wsIconBox}>
                      <Ionicons
                        name="storefront"
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.existingWsContent}>
                      <Text style={styles.existingWsName} numberOfLines={1}>
                        {ws.name}
                      </Text>
                      <Text style={styles.existingWsCode}>
                        Code: {ws.joinCode}
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
            ) : (
              <View style={styles.featureRow}></View>
            )}
          </View>

          {/* Bottom Sheet Card */}
          <View style={styles.bottomCard}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Logged in as - Top of Join with Code and Create New Store */}
            <View style={styles.userTopBar}>
              <View style={styles.userInfo}>
                <View
                  style={[
                    styles.userAvatar,
                    {
                      backgroundColor:
                        currentUser?.avatarColor || Colors.primary,
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
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={15}
                  color={Colors.textMuted}
                />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  activeTab === "join" && styles.tabBtnActive,
                ]}
                onPress={() => {
                  setActiveTab("join");
                  setErrorMsg("");
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="link"
                  size={15}
                  color={
                    activeTab === "join" ? Colors.primary : Colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "join" && styles.tabTextActive,
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
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add-circle"
                  size={15}
                  color={
                    activeTab === "create" ? Colors.primary : Colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "create" && styles.tabTextActive,
                  ]}
                >
                  Create New Store
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message Banner */}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Form Content */}
            {activeTab === "join" ? (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STORE INVITE CODE *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={Colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. APNA-2026"
                      placeholderTextColor={Colors.textMuted}
                      value={joinCode}
                      onChangeText={(val) => setJoinCode(val.toUpperCase())}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    {joinCode.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setJoinCode("")}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isProcessing && styles.submitBtnDisabled,
                  ]}
                  onPress={onJoinStore}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="enter-outline"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.submitBtnText}>
                        Join Store Workspace
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>STORE / DUKAN NAME *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="storefront-outline"
                      size={18}
                      color={Colors.textMuted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Gupta Provision Store"
                      placeholderTextColor={Colors.textMuted}
                      value={storeName}
                      onChangeText={setStoreName}
                      autoCapitalize="words"
                    />
                    {storeName.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setStoreName("")}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={16}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isProcessing && styles.submitBtnDisabled,
                  ]}
                  onPress={onCreateStore}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="storefront" size={20} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>
                        Create Store & Get Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Security Note */}
            <View style={styles.footerNoteBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={Colors.textMuted}
              />
              <Text style={styles.footerNoteText}>
                Collaborate with staff with instant cloud sync
              </Text>
            </View>
          </View>
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
    flexGrow: 1,
    justifyContent: "space-between",
  },
  heroSection: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 160,
  },
  userTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  greetingText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  userNameText: {
    fontSize: 13,
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
  brandingBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 290,
    lineHeight: 18,
  },
  existingWsBox: {
    marginTop: 8,
    marginBottom: 8,
    width: "100%",
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
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  wsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  existingWsContent: {
    flex: 1,
  },
  existingWsName: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  existingWsCode: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 1,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  featureText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  bottomCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 24 : 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: "600",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  footerNoteBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    marginBottom: 4,
  },
  footerNoteText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
