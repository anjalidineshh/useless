import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameState {
  // Progress
  completedActivities: string[];
  activityStats: Record<string, number>;
  timeStarted: number | null;
  currentRoom: string;
  
  // Settings
  soundEnabled: boolean;
  reduceMotion: boolean;
  
  // Achievements
  achievements: Achievement[];
  
  // UI
  showAchievements: boolean;
  newAchievement: Achievement | null;

  // Actions
  completeActivity: (id: string) => void;
  incrementStat: (key: string, amount?: number) => void;
  setCurrentRoom: (room: string) => void;
  toggleSound: () => void;
  toggleReduceMotion: () => void;
  setShowAchievements: (show: boolean) => void;
  clearNewAchievement: () => void;
  resetGame: () => void;
  startTimer: () => void;
  getTimeElapsed: () => number;
  getUselessnessPercent: () => number;
}

const TOTAL_ACTIVITIES = 12;

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_bath', title: 'Bath Enthusiast', description: 'Completed your first virtual bath.', emoji: '🛁', unlocked: false },
  { id: 'dish_washer', title: 'Professional Dish Washer', description: 'Washed 25 virtual dishes.', emoji: '🍽️', unlocked: false },
  { id: 'time_10', title: 'Why Are You Doing This?', description: 'Spent 10 minutes inside the website.', emoji: '🤔', unlocked: false },
  { id: 'all_complete', title: 'Peak Uselessness', description: 'Completed all 12 activities.', emoji: '🏆', unlocked: false },
  { id: 'time_30', title: 'Touch Grass', description: 'Unlocked after spending 30 minutes here.', emoji: '🌿', unlocked: false },
  { id: 'first_blood', title: 'First Blood', description: 'Slapped your first mosquito.', emoji: '🦟', unlocked: false },
  { id: 'mosquito_hunter', title: 'Mosquito Hunter', description: 'Defeated 10 mosquitoes.', emoji: '🎯', unlocked: false },
  { id: 'absolute_menace', title: 'Absolute Menace', description: 'Defeated 25 mosquitoes.', emoji: '💀', unlocked: false },
  { id: 'sleep_destroyer', title: 'Sleep Destroyer', description: 'Defeated 50 mosquitoes.', emoji: '😤', unlocked: false },
  { id: 'tea_master', title: 'Chai Master', description: 'Made 3 cups of virtual tea.', emoji: '☕', unlocked: false },
  { id: 'clean_freak', title: 'Clean Freak', description: 'Completed room cleaning.', emoji: '🧹', unlocked: false },
  { id: 'laundry_pro', title: 'Laundry Legend', description: 'Folded all virtual clothes.', emoji: '👕', unlocked: false },
  { id: 'temperature_seeker', title: 'Temperature Seeker', description: 'Found the perfect shower temperature.', emoji: '🚿', unlocked: false },
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      completedActivities: [],
      activityStats: {},
      timeStarted: null,
      currentRoom: 'living',
      soundEnabled: true,
      reduceMotion: false,
      achievements: DEFAULT_ACHIEVEMENTS,
      showAchievements: false,
      newAchievement: null,

      completeActivity: (id: string) => {
        const state = get();
        if (state.completedActivities.includes(id)) return;
        
        const newCompleted = [...state.completedActivities, id];
        
        // Check achievements
        const toUnlock: string[] = [];
        if (id === 'bath') toUnlock.push('first_bath');
        if (id === 'room_cleaning') toUnlock.push('clean_freak');
        if (id === 'laundry_folding') toUnlock.push('laundry_pro');
        if (id === 'shower_temperature') toUnlock.push('temperature_seeker');
        if (newCompleted.length === TOTAL_ACTIVITIES) toUnlock.push('all_complete');

        let updatedAchievements = state.achievements;
        let latestUnlocked: Achievement | null = null;
        
        toUnlock.forEach(achId => {
          updatedAchievements = updatedAchievements.map(a => {
            if (a.id === achId && !a.unlocked) {
              latestUnlocked = { ...a, unlocked: true, unlockedAt: Date.now() };
              return latestUnlocked;
            }
            return a;
          });
        });

        set({
          completedActivities: newCompleted,
          achievements: updatedAchievements,
          newAchievement: latestUnlocked,
        });
      },

      incrementStat: (key: string, amount = 1) => {
        const state = get();
        const current = state.activityStats[key] || 0;
        const newVal = current + amount;
        const newStats = { ...state.activityStats, [key]: newVal };
        
        // Check stat-based achievements
        const toUnlock: string[] = [];
        if (key === 'mosquitoes' && current === 0 && newVal >= 1) toUnlock.push('first_blood');
        if (key === 'mosquitoes' && current < 10 && newVal >= 10) toUnlock.push('mosquito_hunter');
        if (key === 'mosquitoes' && current < 25 && newVal >= 25) toUnlock.push('absolute_menace');
        if (key === 'mosquitoes' && current < 50 && newVal >= 50) toUnlock.push('sleep_destroyer');
        if (key === 'tea' && current < 3 && newVal >= 3) toUnlock.push('tea_master');
        if (key === 'dishes' && current < 25 && newVal >= 25) toUnlock.push('dish_washer');

        let updatedAchievements = get().achievements;
        let latestUnlocked: Achievement | null = null;
        
        toUnlock.forEach(achId => {
          updatedAchievements = updatedAchievements.map(a => {
            if (a.id === achId && !a.unlocked) {
              latestUnlocked = { ...a, unlocked: true, unlockedAt: Date.now() };
              return latestUnlocked;
            }
            return a;
          });
        });

        set({ activityStats: newStats, achievements: updatedAchievements, newAchievement: latestUnlocked });
      },

      setCurrentRoom: (room: string) => set({ currentRoom: room }),
      toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleReduceMotion: () => set(s => ({ reduceMotion: !s.reduceMotion })),
      setShowAchievements: (show: boolean) => set({ showAchievements: show }),
      clearNewAchievement: () => set({ newAchievement: null }),
      startTimer: () => {
        if (!get().timeStarted) set({ timeStarted: Date.now() });
      },
      
      getTimeElapsed: () => {
        const { timeStarted } = get();
        if (!timeStarted) return 0;
        return Math.floor((Date.now() - timeStarted) / 1000);
      },
      
      getUselessnessPercent: () => {
        const { completedActivities } = get();
        return Math.round((completedActivities.length / TOTAL_ACTIVITIES) * 100);
      },

      resetGame: () => set({
        completedActivities: [],
        activityStats: {},
        timeStarted: Date.now(),
        currentRoom: 'living',
        achievements: DEFAULT_ACHIEVEMENTS,
        newAchievement: null,
      }),
    }),
    {
      name: 'useless-day-storage',
      partialize: (state) => ({
        completedActivities: state.completedActivities,
        activityStats: state.activityStats,
        timeStarted: state.timeStarted,
        achievements: state.achievements,
        soundEnabled: state.soundEnabled,
        reduceMotion: state.reduceMotion,
      }),
    }
  )
);
