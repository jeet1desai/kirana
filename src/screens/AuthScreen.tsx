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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";

export const AuthScreen: React.FC = () => {
  const { handleLogin, handleSignup } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
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

    if (!emailOrPhone.trim()) {
      setErrorMessage("Please enter your mobile number or email");
      return;
    }

    if (!pin.trim()) {
      setErrorMessage(
        mode === "signup"
          ? "Please create a 4-digit PIN / password"
          : "Please enter your 4-digit PIN / password",
      );
      return;
    }

    if (pin.trim().length < 4) {
      setErrorMessage("PIN / password must be at least 4 digits");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await handleSignup(name, emailOrPhone, pin);
        if (!res.success) {
          setErrorMessage(res.message || "Signup failed");
        }
      } else {
        const res = await handleLogin(emailOrPhone, pin);
        if (!res.success) {
          setErrorMessage(res.message || "Invalid credentials");
        }
      }
    } finally {
      setIsSubmitting(false);
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
          {/* Brand Header */}
          <View style={styles.brandingBox}>
            <View style={styles.logoBadge}>
              <Ionicons name="storefront" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.appTitle}>Apna Kirana</Text>
            <Text style={styles.appSubtitle}>
              Shared Price & Inventory for Kirana Stores
            </Text>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}
              onPress={() => {
                setMode("login");
                setErrorMessage("");
              }}
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
              style={[styles.tabBtn, mode === "signup" && styles.tabBtnActive]}
              onPress={() => {
                setMode("signup");
                setErrorMessage("");
              }}
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

          {/* Form Card */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

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
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MOBILE NUMBER OR EMAIL *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={Colors.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210 or name@store.com"
                  placeholderTextColor={Colors.textMuted}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {mode === "login"
                  ? "4-DIGIT PIN / PASSWORD *"
                  : "CREATE 4-DIGIT PIN / PASSWORD *"}
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
                      ? "Enter 4-digit PIN or password"
                      : "Set 4-digit PIN or password (min 4)"
                  }
                  placeholderTextColor={Colors.textMuted}
                  value={pin}
                  onChangeText={setPin}
                  secureTextEntry={!showPin}
                  keyboardType="default"
                  maxLength={32}
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

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              <Ionicons
                name={
                  mode === "login" ? "log-in-outline" : "person-add-outline"
                }
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Log In to Store"
                    : "Create Store Account"}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandingBox: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
    maxWidth: 280,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
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
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
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
    borderRadius: 10,
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
});
