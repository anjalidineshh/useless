import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioEngine } from '../engine/AudioEngine';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_brush', title: 'Brush Enthusiast', description: 'Virtually polished every dental zone.', emoji: '🦷', unlocked: false },
  { id: 'first_blood', title: 'First Blood', description: 'Slapped your first virtual mosquito.', emoji: '🩸', unlocked: false },
  { id: 'mosquito_10', title: 'Mosquito Hunter', description: 'Defeated 10 mosquitoes with raw speed.', emoji: '🎯', unlocked: false },
  { id: 'mosquito_25', title: 'Absolute Menace', description: 'Defeated 25 mosquitoes.', emoji: '💀', unlocked: false },
  { id: 'mosquito_50', title: 'Sleep Destroyer', description: 'Defeated 50 mosquitoes.', emoji: '😤', unlocked: false },
  { id: 'shower_enlightenment', title: 'Shower Enlightenment', description: 'Found the 38.5°C golden temperature.', emoji: '🌡️', unlocked: false },
  { id: 'tea_3', title: 'Chai Master', description: 'Brewed delicious digital masala chai.', emoji: '☕', unlocked: false },
  { id: 'dish_sparkle', title: 'Plate Polisher', description: 'Scrubbed greasy plates to perfection.', emoji: '🍽️', unlocked: false },
  { id: 'bed_destroyer', title: 'Chaos Agent', description: 'Made a perfect bed and instantly destroyed it.', emoji: '🛏️', unlocked: false },
  { id: 'all_done', title: 'Peak Uselessness', description: 'Completed all 12 pointless activities.', emoji: '🏆', unlocked: false },
];

interface GameState {
  completedActivities: string[];
  activityStats: Record<string, number>;
  timeStarted: number | null;
  achievements: Achievement[];
  newAchievement: Achievement | null;
  soundEnabled: boolean;

  completeActivity: (id: string) => void;
  incrementStat: (key: string, amount?: number) => void;
  unlockAchievement: (id: string) => void;
  clearNewAchievement: () => void;
  startTimer: () => void;
  resetGame: () => void;
  toggleSound: () => void;
  getUselessnessPercent: () => number;
  getTimeElapsed: () => number;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      completedActivities: [],
      activityStats: {
        teeth: 0,
        baths: 0,
        dishes: 0,
        clothes: 0,
        mosquitoes: 0,
        tea: 0,
        roomsCleaned: 0,
        bedsMade: 0,
      },
      timeStarted: null,
      achievements: INITIAL_ACHIEVEMENTS,
      newAchievement: null,
      soundEnabled: true,

      completeActivity: (id) => {
        const { completedActivities } = get();
        if (completedActivities.includes(id)) return;
        const newList = [...completedActivities, id];
        set({ completedActivities: newList });

        AudioEngine.playAchievement();

        if (id === 'brushing') get().unlockAchievement('first_brush');
        if (id === 'dishes') get().unlockAchievement('dish_sparkle');
        if (newList.length === 12) get().unlockAchievement('all_done');
      },

      incrementStat: (key, amount = 1) => {
        const current = get().activityStats[key] ?? 0;
        const newVal = current + amount;
        set({ activityStats: { ...get().activityStats, [key]: newVal } });

        if (key === 'mosquitoes') {
          if (current === 0 && newVal >= 1) get().unlockAchievement('first_blood');
          if (current < 10 && newVal >= 10) get().unlockAchievement('mosquito_10');
          if (current < 25 && newVal >= 25) get().unlockAchievement('mosquito_25');
          if (current < 50 && newVal >= 50) get().unlockAchievement('mosquito_50');
        }
        if (key === 'tea' && newVal >= 1) get().unlockAchievement('tea_3');
      },

      unlockAchievement: (id) => {
        const ach = get().achievements.find(a => a.id === id && !a.unlocked);
        if (!ach) return;
        const updated = { ...ach, unlocked: true };
        set({
          achievements: get().achievements.map(a => a.id === id ? updated : a),
          newAchievement: updated,
        });
        AudioEngine.playAchievement();
      },

      clearNewAchievement: () => set({ newAchievement: null }),
      startTimer: () => { if (!get().timeStarted) set({ timeStarted: Date.now() }); },
      toggleSound: () => {
        const next = !get().soundEnabled;
        AudioEngine.setEnabled(next);
        set({ soundEnabled: next });
      },
      resetGame: () => set({
        completedActivities: [],
        activityStats: {
          teeth: 0,
          baths: 0,
          dishes: 0,
          clothes: 0,
          mosquitoes: 0,
          tea: 0,
          roomsCleaned: 0,
          bedsMade: 0,
        },
        timeStarted: Date.now(),
        achievements: INITIAL_ACHIEVEMENTS,
        newAchievement: null,
      }),
      getUselessnessPercent: () => Math.round((get().completedActivities.length / 12) * 100),
      getTimeElapsed: () => {
        const { timeStarted } = get();
        return timeStarted ? Math.floor((Date.now() - timeStarted) / 1000) : 0;
      },
    }),
    {
      name: 'useless-day-v3',
      partialize: (s) => ({
        completedActivities: s.completedActivities,
        activityStats: s.activityStats,
        timeStarted: s.timeStarted,
        achievements: s.achievements,
        soundEnabled: s.soundEnabled,
      }),
    }
  )
);
