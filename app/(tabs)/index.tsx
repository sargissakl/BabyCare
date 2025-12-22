import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBaby } from '@/hooks/useBaby';
import { spacing, borderRadius } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { Activity } from '@/types/baby';
import { useAlert } from '@/template';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, shadows } = useTheme();
  const { addActivity, getTodayActivities, activeTimer, startTimer, stopTimer } = useBaby();
  const { showAlert } = useAlert();
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [showFeedingMenu, setShowFeedingMenu] = useState(false);
  const [showDiaperMenu, setShowDiaperMenu] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    setTodayActivities(getTodayActivities());
  }, []);

  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - activeTimer.startTime);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [activeTimer]);

  const handleQuickLog = (type: Activity['type']) => {
    if (type === 'sleep' || type === 'playtime') {
      if (activeTimer?.type === type) {
        const duration = stopTimer();
        if (duration) {
          addActivity({ type, timestamp: Date.now() - duration, duration });
          setTodayActivities(getTodayActivities());
        }
      } else {
        if (activeTimer) {
          showAlert('Timer Active', `Please stop the ${activeTimer.type} timer first`);
          return;
        }
        startTimer(type);
      }
    } else if (type === 'feeding') {
      setShowFeedingMenu(true);
    } else if (type === 'diaper') {
      setShowDiaperMenu(true);
    }
  };

  const handleFeedingSelect = (feedingType: 'breast' | 'bottle' | 'solid') => {
    addActivity({ type: 'feeding', timestamp: Date.now(), feedingType });
    setTodayActivities(getTodayActivities());
    setShowFeedingMenu(false);
  };

  const handleDiaperSelect = (diaperType: 'wet' | 'dirty' | 'both') => {
    addActivity({ type: 'diaper', timestamp: Date.now(), diaperType });
    setTodayActivities(getTodayActivities());
    setShowDiaperMenu(false);
  };

  const stats = {
    sleep: todayActivities.filter((a) => a.type === 'sleep').reduce((sum, a) => sum + (a.duration || 0), 0),
    feeding: todayActivities.filter((a) => a.type === 'feeding').length,
    diaper: todayActivities.filter((a) => a.type === 'diaper').length,
    playtime: todayActivities.filter((a) => a.type === 'playtime').reduce((sum, a) => sum + (a.duration || 0), 0),
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatStatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const cardWidth = Math.max(1, (dimensions.width - spacing.md * 3) / 2);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingTop: insets.top + spacing.md,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.title,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodySmall,
    },
    quickActions: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.heading,
      marginBottom: spacing.md,
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    actionButton: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: cardWidth,
      height: 120,
      ...shadows.md,
    },
    actionButtonActive: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    actionLabel: {
      ...typography.body,
      fontWeight: '600',
    },
    timerText: {
      ...typography.caption,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    statsSection: {
      marginBottom: spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      width: cardWidth,
      ...shadows.sm,
    },
    statValue: {
      ...typography.title,
      marginBottom: spacing.xs,
    },
    statLabel: {
      ...typography.bodySmall,
    },
    recentSection: {
      marginBottom: spacing.xl,
    },
    activityItem: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      ...shadows.sm,
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    activityContent: {
      flex: 1,
    },
    activityType: {
      ...typography.body,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    activityTime: {
      ...typography.caption,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      width: Math.min(300, dimensions.width - spacing.md * 2),
    },
    modalTitle: {
      ...typography.heading,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    menuButton: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    menuButtonText: {
      ...typography.body,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...typography.body,
    },
  });

  const actionButtons = [
    { type: 'sleep' as const, icon: 'moon', color: colors.secondary, label: 'Sleep' },
    { type: 'feeding' as const, icon: 'nutrition', color: colors.primary, label: 'Feeding' },
    { type: 'diaper' as const, icon: 'water', color: colors.accent, label: 'Diaper' },
    { type: 'playtime' as const, icon: 'game-controller', color: colors.success, label: 'Playtime' },
  ];

  const recentActivities = todayActivities.slice(0, 5);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'sleep': return 'moon';
      case 'feeding': return 'nutrition';
      case 'diaper': return 'water';
      case 'playtime': return 'game-controller';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'sleep': return colors.secondary;
      case 'feeding': return colors.primary;
      case 'diaper': return colors.accent;
      case 'playtime': return colors.success;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityDetails = (activity: Activity) => {
    let details = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
    if (activity.feedingType) {
      details += ` - ${activity.feedingType.charAt(0).toUpperCase() + activity.feedingType.slice(1)}`;
    }
    if (activity.diaperType) {
      details += ` - ${activity.diaperType.charAt(0).toUpperCase() + activity.diaperType.slice(1)}`;
    }
    return details;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Baby Care</Text>
          <Text style={styles.subtitle}>Track your little one's daily activities</Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.actionsGrid}>
            {actionButtons.map((action) => {
              const isActive = activeTimer?.type === action.type;
              return (
                <TouchableOpacity
                  key={action.type}
                  style={[styles.actionButton, isActive && styles.actionButtonActive]}
                  onPress={() => handleQuickLog(action.type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  {isActive && (
                    <Text style={styles.timerText}>{formatDuration(elapsedTime)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {formatStatDuration(stats.sleep)}
              </Text>
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stats.feeding}
              </Text>
              <Text style={styles.statLabel}>Feedings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {stats.diaper}
              </Text>
              <Text style={styles.statLabel}>Diapers</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatStatDuration(stats.playtime)}
              </Text>
              <Text style={styles.statLabel}>Playtime</Text>
            </View>
          </View>
        </View>

        {recentActivities.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIconContainer,
                    { backgroundColor: getActivityColor(activity.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getActivityIcon(activity.type) as any}
                    size={20}
                    color={getActivityColor(activity.type)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityType}>{getActivityDetails(activity)}</Text>
                  <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showFeedingMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeedingMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Feeding Type</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleFeedingSelect('breast')}
            >
              <Ionicons name="heart" size={24} color={colors.primary} />
              <Text style={styles.menuButtonText}>Breast</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleFeedingSelect('bottle')}
            >
              <Ionicons name="flask" size={24} color={colors.primary} />
              <Text style={styles.menuButtonText}>Bottle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleFeedingSelect('solid')}
            >
              <Ionicons name="restaurant" size={24} color={colors.primary} />
              <Text style={styles.menuButtonText}>Solid Food</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowFeedingMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDiaperMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiaperMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Diaper Change</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleDiaperSelect('wet')}
            >
              <Ionicons name="water" size={24} color={colors.accent} />
              <Text style={styles.menuButtonText}>Pee</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleDiaperSelect('dirty')}
            >
              <Ionicons name="color-fill" size={24} color={colors.accent} />
              <Text style={styles.menuButtonText}>Poo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => handleDiaperSelect('both')}
            >
              <Ionicons name="layers" size={24} color={colors.accent} />
              <Text style={styles.menuButtonText}>Both</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDiaperMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
