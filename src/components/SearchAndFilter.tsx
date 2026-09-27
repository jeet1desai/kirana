import * as React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../context/StoreContext";
import { Colors } from "../theme/colors";

export const SearchAndFilter: React.FC = () => {
  const { searchQuery, setSearchQuery } = useStore();

  return (
    <View style={styles.container}>
      {/* Sleek Search Input */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search"
          size={19}
          color={Colors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder='Search "amul milk", "salt", "atta", "oil"...'
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearBtn}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
});
