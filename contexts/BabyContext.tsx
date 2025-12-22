import { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, ActiveTimer } from '@/types/baby';

interface BabyContextType {
  activities: Activity[];
  activeTimer: ActiveTimer | null;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivitiesByType: (type: Activity['type']) => Activity[];
  getTodayActivities: () => Activity[];
  startTimer: (type: 'sleep' | 'playtime') => void;
  stopTimer: () => number | null;
}

export const BabyContext = createContext<BabyContextType | undefined>(undefined);

const STORAGE_KEY = '@baby_activities';

export function BabyProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    saveActivities();
  }, [activities]);

  const loadActivities = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setActivities(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const saveActivities = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Failed to save activities:', error);
    }
  };

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, ...updates } : activity
      )
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
  };

  const getActivitiesByType = (type: Activity['type']) => {
    return activities.filter((activity) => activity.type === type);
  };

  const getTodayActivities = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return activities.filter((activity) => activity.timestamp >= today.getTime());
  };

  const startTimer = (type: 'sleep' | 'playtime') => {
    setActiveTimer({ type, startTime: Date.now() });
  };

  const stopTimer = (): number | null => {
    if (!activeTimer) return null;
    const duration = Date.now() - activeTimer.startTime;
    setActiveTimer(null);
    return duration;
  };

  return (
    <BabyContext.Provider
      value={{
        activities,
        activeTimer,
        addActivity,
        updateActivity,
        deleteActivity,
        getActivitiesByType,
        getTodayActivities,
        startTimer,
        stopTimer,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
}
