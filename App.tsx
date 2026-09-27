import * as React from "react";
import { StatusBar, View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { StoreProvider } from "./src/context/StoreContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { WorkspaceSetupScreen } from "./src/screens/WorkspaceSetupScreen";
import { Colors } from "./src/theme/colors";

function MainNavigator() {
  const { currentUser, activeWorkspace, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F8FAFC",
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  if (!activeWorkspace) {
    return <WorkspaceSetupScreen />;
  }

  return (
    <StoreProvider>
      <HomeScreen />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainNavigator />
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
