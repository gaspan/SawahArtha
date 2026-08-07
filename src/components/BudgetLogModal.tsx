import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR } from '../utils/currency';
import type { BudgetLog } from '../database/budgetService';

interface Props {
  visible: boolean;
  logs: BudgetLog[];
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function actionLabel(action: BudgetLog['action']): string {
  switch (action) {
    case 'seed': return 'Anggaran awal dibuat';
    case 'create': return 'Anggaran baru ditambahkan';
    case 'update': return 'Anggaran diubah';
    case 'delete': return 'Anggaran dihapus';
  }
}

function actionColor(action: BudgetLog['action']): string {
  switch (action) {
    case 'seed': return COLORS.textLight;
    case 'create': return COLORS.success;
    case 'update': return COLORS.warning;
    case 'delete': return COLORS.danger;
  }
}

export default function BudgetLogModal({ visible, logs, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Riwayat Perubahan Anggaran</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Belum ada perubahan anggaran</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {logs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{log.category}</Text>
                    </View>
                    <View style={styles.dateGroup}>
                      <Text style={styles.dateText}>{formatDate(log.changed_at)}</Text>
                      <Text style={styles.timeText}>{formatTime(log.changed_at)}</Text>
                    </View>
                  </View>

                  <View style={styles.logBody}>
                    <Text
                      style={[styles.actionText, { color: actionColor(log.action) }]}
                    >
                      {actionLabel(log.action)}
                    </Text>

                    {log.action !== 'delete' && log.action !== 'seed' ? (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountOld}>
                          {formatIDR(log.old_amount)}
                        </Text>
                        <Text style={styles.arrow}>
                          {log.new_amount > log.old_amount ? ' → ' : ' → '}
                        </Text>
                        <Text
                          style={[
                            styles.amountNew,
                            {
                              color:
                                log.new_amount > log.old_amount
                                  ? COLORS.warning
                                  : COLORS.info,
                            },
                          ]}
                        >
                          {formatIDR(log.new_amount)}
                        </Text>
                        <Text style={styles.delta}>
                          {log.new_amount > log.old_amount ? '↑' : '↓'}
                        </Text>
                      </View>
                    ) : log.action === 'seed' ? (
                      <Text style={styles.amountSeed}>
                        {formatIDR(log.new_amount)}
                      </Text>
                    ) : (
                      <Text style={styles.amountDeleted}>
                        {formatIDR(log.old_amount)} → Dihapus
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '75%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    flex: 1,
  },
  closeBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  closeBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  emptyState: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
  list: {
    maxHeight: '90%',
  },
  listContent: {
    paddingBottom: SPACING.sm,
  },
  logItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  catBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  dateGroup: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  logBody: {
    gap: 2,
  },
  actionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountOld: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
  amountNew: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  arrow: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  delta: {
    fontSize: FONT_SIZE.xs,
    marginLeft: 4,
  },
  amountSeed: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  amountDeleted: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
  },
});
