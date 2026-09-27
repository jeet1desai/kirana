import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncNotification } from '../types';
import { Colors } from '../theme/colors';

interface Props {
  notification: SyncNotification | null;
  onDismiss: () => void;
}

export const SyncNotificationToast: React.FC<Props> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  return (
    <View style={styles.container}>
      <View style={styles.toast}>
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
    lineHeight: 18,
  },
  dismissBtn: {
    padding: 6,
    marginLeft: 8,
  },
});
