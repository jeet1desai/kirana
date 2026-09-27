import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../context/StoreContext';
import { Colors } from '../theme/colors';
import { ActivityLog } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ActivityLogModal: React.FC<Props> = ({ visible, onClose }) => {
  const { activityLogs } = useStore();

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'PRICE_CHANGE':
        return { icon: 'trending-up', color: Colors.primary, bg: '#D1FAE5' };
      case 'STOCK_UPDATE':
        return { icon: 'cube', color: '#0284C7', bg: '#E0F2FE' };
      case 'PRODUCT_ADD':
        return { icon: 'add-circle', color: '#7C3AED', bg: '#EDE9FE' };
      case 'PRODUCT_DELETE':
        return { icon: 'trash', color: Colors.danger, bg: '#FEE2E2' };
      default:
        return { icon: 'information-circle', color: Colors.textSecondary, bg: '#F1F5F9' };
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Group logs into Today, Yesterday, Earlier
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const todayLogs: ActivityLog[] = [];
  const yesterdayLogs: ActivityLog[] = [];
  const earlierLogs: ActivityLog[] = [];

  activityLogs.forEach((log) => {
    const logDate = new Date(log.created_at).toDateString();
    if (logDate === today) {
      todayLogs.push(log);
    } else if (logDate === yesterday) {
      yesterdayLogs.push(log);
    } else {
      earlierLogs.push(log);
    }
  });

  const renderSection = (title: string, logs: ActivityLog[]) => {
    if (logs.length === 0) return null;
    return (
      <View style={styles.sectionContainer} key={title}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{logs.length}</Text>
          </View>
        </View>

        {logs.map((log) => {
          const iconInfo = getActionIcon(log.action_type);
          const isPrimaryUser = log.user_name.toLowerCase().includes('ramesh');
          return (
            <View key={log.id} style={styles.logCard}>
              <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
                <Ionicons name={iconInfo.icon as any} size={18} color={iconInfo.color} />
              </View>

              <View style={styles.logContent}>
                <View style={styles.logTopRow}>
                  <View
                    style={[
                      styles.userBadge,
                      {
                        backgroundColor: isPrimaryUser
                          ? Colors.userPrimaryLight
                          : Colors.userSecondaryLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.userBadgeText,
                        { color: isPrimaryUser ? Colors.userPrimary : Colors.userSecondary },
                      ]}
                    >
                      {log.user_name}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>{formatLogTime(log.created_at)}</Text>
                </View>

                <Text style={styles.logTitle}>{log.title}</Text>
                <Text style={styles.logDescription}>{log.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>STORE AUDIT LOG</Text>
              <Text style={styles.headerTitle}>Recent Activity</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPadding}>
            {activityLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Activity Recorded Yet</Text>
              </View>
            ) : (
              <>
                {renderSection('Today', todayLogs)}
                {renderSection('Yesterday', yesterdayLogs)}
                {renderSection('Earlier', earlierLogs)}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>Close Activity Feed</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  scrollPadding: {
    paddingBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  logDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeActionBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
