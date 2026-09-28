import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

export const AuthScreen: React.FC = () => {
  const { handleLogin, handleSignup } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setErrorMessage("");

    if (mode === "signup" && !name.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMessage("Please enter your 10-digit mobile number");
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!pin.trim()) {
      setErrorMessage(
        mode === "signup"
          ? "Please set a 4-digit PIN"
          : "Please enter your 4-digit PIN",
      );
      return;
    }

    if (pin.trim().length < 4) {
      setErrorMessage("PIN must be at least 4 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await handleSignup(name, cleanPhone, pin);
        if (!res.success) {
          setErrorMessage(res.message || "Signup failed");
        }
      } else {
        const res = await handleLogin(cleanPhone, pin);
        if (!res.success) {
          setErrorMessage(res.message || "Invalid mobile number or PIN");
        }
      }
    } finally {
      setIsSubmitting(false);
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
          {/* Top Hero Branding */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="storefront" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.appTitle}>Kirana</Text>
            <Text style={styles.appSubtitle}>
              Smart Price & Inventory Management for Kirana Stores
            </Text>
          </View>

          {/* Bottom Auth Sheet Card */}
          <View style={styles.bottomCard}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}
                onPress={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "login" && styles.tabTextActive,
                  ]}
                >
                  Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  mode === "signup" && styles.tabBtnActive,
                ]}
                onPress={() => {
                  setMode("signup");
                  setErrorMessage("");
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    mode === "signup" && styles.tabTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Full Name (Sign Up only) */}
            {mode === "signup" && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>YOUR FULL NAME *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={Colors.textMuted}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Ramesh Gupta"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Mobile Number Alone (No Email) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER *</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.flagText}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={styles.codeDivider} />
                <TextInput
                  style={styles.textInput}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ""))}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {phone.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setPhone("")}
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

            {/* PIN / Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {mode === "login" ? "4-DIGIT PIN *" : "CREATE 4-DIGIT PIN *"}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    mode === "login"
                      ? "Enter your 4-digit PIN"
                      : "Set a 4-digit PIN (min 4)"
                  }
                  placeholderTextColor={Colors.textMuted}
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  maxLength={16}
                />
                <TouchableOpacity
                  onPress={() => setShowPin(!showPin)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={showPin ? "Hide PIN" : "Show PIN"}
                >
                  <Ionicons
                    name={showPin ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={onSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={
                      mode === "login" ? "log-in-outline" : "person-add-outline"
                    }
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitBtnText}>
                    {mode === "login"
                      ? "Log In with Mobile"
                      : "Create Store Account"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Bottom Security Note */}
            <View style={styles.footerNoteBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={Colors.textMuted}
              />
              <Text style={styles.footerNoteText}>
                Fast & secure login for your Kirana dukan
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    minHeight: 180,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  appTitle: {
    fontSize: 28,
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
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
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
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
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
  countryCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 11,
  },
  flagText: {
    fontSize: 15,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  codeDivider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.borderDark,
    marginHorizontal: 10,
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
  eyeBtn: {
    padding: 6,
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
