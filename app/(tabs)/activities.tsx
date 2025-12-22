import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBaby } from '@/hooks/useBaby';
import { spacing, borderRadius } from '@/constants/theme';
import { Activity } from '@/types/baby';
import { useEffect } from 'react';
import { useAlert } from '@/template';

export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, shadows } = useTheme();
  const { activities, addActivity, deleteActivity } = useBaby();
  const { showAlert } = useAlert();
  const [selectedType, setSelectedType] = useState<Activity['type'] | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({});
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const update = () => setDimensions(Dimensions.get('window'));
    update();
    const sub = Dimensions.addEventListener('change', update);
    return () => sub?.remove();
  }, []);

  const filteredActivities = selectedType === 'all' 
    ? activities 
    : activities.filter((a) => a.type === selectedType);

  const handleAddActivity = () => {
    if (!newActivity.type) {
      showAlert('Error', 'Please select an activity type');
      return;
    }
    
    addActivity({
      type: newActivity.type,
      timestamp: newActivity.timestamp || Date.now(),
      duration: newActivity.duration,
      notes: newActivity.notes,
    });
    
    setShowAddModal(false);
    setNewActivity({});
  };

  const handleDeleteActivity = (id: string) => {
    showAlert('Delete Activity', 'Are you sure you want to delete this activity?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteActivity(id) },
    ]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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

  const filterWidth = Math.max(1, (dimensions.width - spacing.md * 6) / 5);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.title,
      marginBottom: spacing.md,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    filterButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceVariant,
      minWidth: filterWidth,
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterText: {
      ...typography.bodySmall,
      fontWeight: '600',
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    activityItem: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    activityInfo: {
      flex: 1,
    },
    activityType: {
      ...typography.subheading,
      marginBottom: spacing.xs,
    },
    activityTime: {
      ...typography.caption,
    },
    deleteButton: {
      padding: spacing.sm,
    },
    activityDetails: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailText: {
      ...typography.bodySmall,
    },
    fab: {
      position: 'absolute',
      bottom: insets.bottom + spacing.md,
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.lg,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      ...typography.body,
      marginTop: spacing.md,
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
      width: Math.min(400, dimensions.width - spacing.md * 2),
      maxHeight: dimensions.height * 0.8,
    },
    modalTitle: {
      ...typography.heading,
      marginBottom: spacing.lg,
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    typeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceVariant,
    },
    typeButtonSelected: {
      backgroundColor: colors.primary,
    },
    typeButtonText: {
      ...typography.bodySmall,
      fontWeight: '600',
    },
    typeButtonTextSelected: {
      color: '#FFFFFF',
    },
    input: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...typography.body,
      color: colors.text,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    modalButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surfaceVariant,
    },
    addButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      ...typography.button,
      color: colors.text,
    },
    buttonTextPrimary: {
      color: '#FFFFFF',
    },
  });

  const filters: Array<{ type: Activity['type'] | 'all'; label: string }> = [
    { type: 'all', label: 'All' },
    { type: 'sleep', label: 'Sleep' },
    { type: 'feeding', label: 'Feed' },
    { type: 'diaper', label: 'Diaper' },
    { type: 'playtime', label: 'Play' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Log</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.type}
                style={[
                  styles.filterButton,
                  selectedType === filter.type && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedType(filter.type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedType === filter.type && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No activities yet</Text>
          </View>
        ) : (
          filteredActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getActivityColor(activity.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getActivityIcon(activity.type) as any}
                    size={24}
                    color={getActivityColor(activity.type)}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityType}>
                    {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                  </Text>
                  <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteActivity(activity.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              {(activity.duration || activity.notes) && (
                <View style={styles.activityDetails}>
                  {activity.duration && (
                    <Text style={styles.detailText}>
                      Duration: {formatDuration(activity.duration)}
                    </Text>
                  )}
                  {activity.notes && (
                    <Text style={styles.detailText}>Notes: {activity.notes}</Text>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Activity</Text>
            
            <View style={styles.typeSelector}>
              {(['sleep', 'feeding', 'diaper', 'playtime'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newActivity.type === type && styles.typeButtonSelected,
                  ]}
                  onPress={() => setNewActivity({ ...newActivity, type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newActivity.type === type && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textTertiary}
              value={newActivity.notes || ''}
              onChangeText={(text) => setNewActivity({ ...newActivity, notes: text })}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewActivity({});
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddActivity}
              >
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
