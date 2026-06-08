import { ProgrammingLanguage } from '@/types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  requirement: number;
  condition: AchievementCondition;
}

export type AchievementCategory = 'volume' | 'speed' | 'accuracy' | 'streak' | 'language' | 'special';

export interface AchievementCondition {
  type: 'exercises-completed' | 'streak' | 'wpm' | 'accuracy' | 'language-completed' | 'time-spent' | 'perfect-score';
  value: number;
  language?: ProgrammingLanguage;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  xpAwarded: number;
}

export interface AchievementResult {
  unlocked: Achievement[];
  totalXPAwarded: number;
  newLevel: number;
  previousLevel: number;
  milestone: MilestoneType | null;
}

export type MilestoneType = 
  | 'first-exercise'
  | 'streak-week'
  | 'streak-month'
  | 'wpm-50'
  | 'wpm-80'
  | 'accuracy-100'
  | 'language-mastered'
  | 'level-up';

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  xpTotal: number;
  progress: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-exercise',
    name: 'First Steps',
    description: 'Complete your first exercise',
    icon: '🎯',
    category: 'volume',
    xpReward: 10,
    requirement: 1,
    condition: { type: 'exercises-completed', value: 1 },
  },
  {
    id: 'ten-exercises',
    name: 'Getting Started',
    description: 'Complete 10 exercises',
    icon: '🚀',
    category: 'volume',
    xpReward: 25,
    requirement: 10,
    condition: { type: 'exercises-completed', value: 10 },
  },
  {
    id: 'fifty-exercises',
    name: 'Dedicated Learner',
    description: 'Complete 50 exercises',
    icon: '💪',
    category: 'volume',
    xpReward: 100,
    requirement: 50,
    condition: { type: 'exercises-completed', value: 50 },
  },
  {
    id: 'hundred-exercises',
    name: 'Century Club',
    description: 'Complete 100 exercises',
    icon: '🏅',
    category: 'volume',
    xpReward: 250,
    requirement: 100,
    condition: { type: 'exercises-completed', value: 100 },
  },
  {
    id: 'wpm-20',
    name: 'Speed Starter',
    description: 'Reach 20 WPM',
    icon: '⚡',
    category: 'speed',
    xpReward: 15,
    requirement: 20,
    condition: { type: 'wpm', value: 20 },
  },
  {
    id: 'wpm-30',
    name: 'Speed Demon',
    description: 'Reach 30 WPM',
    icon: '🔥',
    category: 'speed',
    xpReward: 30,
    requirement: 30,
    condition: { type: 'wpm', value: 30 },
  },
  {
    id: 'wpm-50',
    name: 'Fast Typer',
    description: 'Reach 50 WPM',
    icon: '🌪️',
    category: 'speed',
    xpReward: 75,
    requirement: 50,
    condition: { type: 'wpm', value: 50 },
  },
  {
    id: 'wpm-80',
    name: 'Lightning Fast',
    description: 'Reach 80 WPM',
    icon: '⚡',
    category: 'speed',
    xpReward: 150,
    requirement: 80,
    condition: { type: 'wpm', value: 80 },
  },
  {
    id: 'wpm-100',
    name: 'Typing God',
    description: 'Reach 100 WPM',
    icon: '👑',
    category: 'speed',
    xpReward: 300,
    requirement: 100,
    condition: { type: 'wpm', value: 100 },
  },
  {
    id: 'accuracy-80',
    name: 'Focused',
    description: 'Achieve 80% accuracy',
    icon: '🎯',
    category: 'accuracy',
    xpReward: 20,
    requirement: 80,
    condition: { type: 'accuracy', value: 80 },
  },
  {
    id: 'accuracy-90',
    name: 'Precision',
    description: 'Achieve 90% accuracy',
    icon: '🔭',
    category: 'accuracy',
    xpReward: 40,
    requirement: 90,
    condition: { type: 'accuracy', value: 90 },
  },
  {
    id: 'accuracy-95',
    name: 'Sharp Eye',
    description: 'Achieve 95% accuracy',
    icon: '👁️',
    category: 'accuracy',
    xpReward: 75,
    requirement: 95,
    condition: { type: 'accuracy', value: 95 },
  },
  {
    id: 'accuracy-100',
    name: 'Perfection',
    description: 'Achieve 100% accuracy',
    icon: '💎',
    category: 'accuracy',
    xpReward: 200,
    requirement: 100,
    condition: { type: 'perfect-score', value: 1 },
  },
  {
    id: 'streak-3',
    name: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: '📅',
    category: 'streak',
    xpReward: 20,
    requirement: 3,
    condition: { type: 'streak', value: 3 },
  },
  {
    id: 'streak-7',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🗓️',
    category: 'streak',
    xpReward: 50,
    requirement: 7,
    condition: { type: 'streak', value: 7 },
  },
  {
    id: 'streak-14',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak',
    icon: '🛡️',
    category: 'streak',
    xpReward: 100,
    requirement: 14,
    condition: { type: 'streak', value: 14 },
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'streak',
    xpReward: 250,
    requirement: 30,
    condition: { type: 'streak', value: 30 },
  },
  {
    id: 'streak-100',
    name: 'Unstoppable',
    description: 'Maintain a 100-day streak',
    icon: '💫',
    category: 'streak',
    xpReward: 500,
    requirement: 100,
    condition: { type: 'streak', value: 100 },
  },
  {
    id: 'js-10',
    name: 'JS Apprentice',
    description: 'Complete 10 JavaScript exercises',
    icon: '🟨',
    category: 'language',
    xpReward: 30,
    requirement: 10,
    condition: { type: 'language-completed', value: 10, language: 'javascript' },
  },
  {
    id: 'js-master',
    name: 'JS Ninja',
    description: 'Complete all JavaScript exercises',
    icon: '🥷',
    category: 'language',
    xpReward: 200,
    requirement: 35,
    condition: { type: 'language-completed', value: 35, language: 'javascript' },
  },
  {
    id: 'ts-10',
    name: 'TS Apprentice',
    description: 'Complete 10 TypeScript exercises',
    icon: '🔷',
    category: 'language',
    xpReward: 30,
    requirement: 10,
    condition: { type: 'language-completed', value: 10, language: 'typescript' },
  },
  {
    id: 'ts-master',
    name: 'TS Master',
    description: 'Complete all TypeScript exercises',
    icon: '🎓',
    category: 'language',
    xpReward: 200,
    requirement: 35,
    condition: { type: 'language-completed', value: 35, language: 'typescript' },
  },
  {
    id: 'py-10',
    name: 'Python Apprentice',
    description: 'Complete 10 Python exercises',
    icon: '🐍',
    category: 'language',
    xpReward: 30,
    requirement: 10,
    condition: { type: 'language-completed', value: 10, language: 'python' },
  },
  {
    id: 'py-master',
    name: 'Python Pro',
    description: 'Complete all Python exercises',
    icon: '🐍',
    category: 'language',
    xpReward: 200,
    requirement: 35,
    condition: { type: 'language-completed', value: 35, language: 'python' },
  },
  {
    id: 'time-1h',
    name: 'Time Invested',
    description: 'Spend 1 hour practicing',
    icon: '⏰',
    category: 'special',
    xpReward: 50,
    requirement: 3600000,
    condition: { type: 'time-spent', value: 3600000 },
  },
  {
    id: 'time-10h',
    name: 'Dedicated',
    description: 'Spend 10 hours practicing',
    icon: '🕐',
    category: 'special',
    xpReward: 150,
    requirement: 36000000,
    condition: { type: 'time-spent', value: 36000000 },
  },
];

export const LEVELS = [
  { level: 1, title: 'Novice', xpRequired: 0 },
  { level: 2, title: 'Beginner', xpRequired: 100 },
  { level: 3, title: 'Intermediate', xpRequired: 300 },
  { level: 4, title: 'Advanced', xpRequired: 600 },
  { level: 5, title: 'Expert', xpRequired: 1000 },
  { level: 6, title: 'Master', xpRequired: 1500 },
  { level: 7, title: 'Grandmaster', xpRequired: 2200 },
  { level: 8, title: 'Legend', xpRequired: 3000 },
  { level: 9, title: 'Mythic', xpRequired: 4000 },
  { level: 10, title: 'Divine', xpRequired: 5500 },
];

export function calculateLevel(xp: number): LevelInfo {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1] || LEVELS[LEVELS.length - 1];
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }

  const progress = nextLevel.xpRequired > currentLevel.xpRequired
    ? ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpRequired: currentLevel.xpRequired,
    xpTotal: xp,
    progress: Math.min(progress, 100),
  };
}

export function checkAchievements(params: {
  totalExercises: number;
  currentStreak: number;
  longestStreak: number;
  bestWpm: number;
  bestAccuracy: number;
  completedByLanguage: Record<ProgrammingLanguage, number>;
  totalTimeSpent: number;
  previousXP: number;
  unlockedAchievementIds: Set<string>;
}): AchievementResult {
  const {
    totalExercises,
    longestStreak,
    bestWpm,
    bestAccuracy,
    completedByLanguage,
    totalTimeSpent,
    previousXP,
    unlockedAchievementIds,
  } = params;

  const unlocked: Achievement[] = [];
  let totalXPAwarded = 0;
  const previousLevel = calculateLevel(previousXP).level;

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAchievementIds.has(achievement.id)) {
      continue;
    }

    let earned = false;

    switch (achievement.condition.type) {
      case 'exercises-completed':
        earned = totalExercises >= achievement.condition.value;
        break;
      case 'streak':
        earned = longestStreak >= achievement.condition.value;
        break;
      case 'wpm':
        earned = bestWpm >= achievement.condition.value;
        break;
      case 'accuracy':
      case 'perfect-score':
        if (achievement.condition.type === 'perfect-score') {
          earned = bestAccuracy === 100;
        } else {
          earned = bestAccuracy >= achievement.condition.value;
        }
        break;
      case 'language-completed':
        const lang = achievement.condition.language;
        if (lang) {
          earned = (completedByLanguage[lang] || 0) >= achievement.condition.value;
        }
        break;
      case 'time-spent':
        earned = totalTimeSpent >= achievement.condition.value;
        break;
    }

    if (earned) {
      unlocked.push(achievement);
      totalXPAwarded += achievement.xpReward;
    }
  }

  const newXP = previousXP + totalXPAwarded;
  const newLevel = calculateLevel(newXP).level;

  const milestone = detectMilestone(unlocked, previousLevel, newLevel);

  return {
    unlocked,
    totalXPAwarded,
    newLevel,
    previousLevel,
    milestone,
  };
}

function detectMilestone(
  unlocked: Achievement[],
  previousLevel: number,
  newLevel: number,
): MilestoneType | null {
  const hasFirstExercise = unlocked.some(a => a.id === 'first-exercise');
  const hasStreak7 = unlocked.some(a => a.id === 'streak-7');
  const hasStreak30 = unlocked.some(a => a.id === 'streak-30');
  const hasWpm50 = unlocked.some(a => a.id === 'wpm-50');
  const hasWpm80 = unlocked.some(a => a.id === 'wpm-80');
  const hasPerfect = unlocked.some(a => a.id === 'accuracy-100');
  const hasLanguageMastered = unlocked.some(a => a.category === 'language' && a.id.includes('master'));

  if (hasFirstExercise) return 'first-exercise';
  if (newLevel > previousLevel) return 'level-up';
  if (hasStreak30) return 'streak-month';
  if (hasStreak7) return 'streak-week';
  if (hasWpm80) return 'wpm-80';
  if (hasWpm50) return 'wpm-50';
  if (hasPerfect) return 'accuracy-100';
  if (hasLanguageMastered) return 'language-mastered';

  return null;
}

export function getLevelTitle(level: number): string {
  const levelInfo = LEVELS.find(l => l.level === level);
  return levelInfo?.title || 'Unknown';
}

export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
  return nextLevel ? nextLevel.xpRequired - currentXP : 0;
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getNextAchievementInCategory(
  category: AchievementCategory,
  unlockedIds: Set<string>
): Achievement | null {
  const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
  for (const achievement of categoryAchievements) {
    if (!unlockedIds.has(achievement.id)) {
      return achievement;
    }
  }
  return null;
}

export function formatAchievementNotification(
  achievement: Achievement,
  levelInfo: LevelInfo
): string {
  return `🏆 Achievement Unlocked: ${achievement.name}!\n\n${achievement.description}\n\n+${achievement.xpReward} XP | Level ${levelInfo.level} - ${levelInfo.title}`;
}

export function formatMilestoneNotification(
  milestone: MilestoneType,
  levelInfo: LevelInfo
): string {
  const messages: Record<MilestoneType, string> = {
    'first-exercise': "🎉 You completed your first exercise! Keep going!",
    'level-up': `⭐ Level Up! You're now level ${levelInfo.level} - ${levelInfo.title}`,
    'streak-week': "🔥 7-day streak! You're on fire!",
    'streak-month': "🏆 30-day streak! You're unstoppable!",
    'wpm-50': "⚡ 50 WPM achieved! Lightning fast!",
    'wpm-80': "🌪️ 80 WPM achieved! Typing god mode!",
    'accuracy-100': "💎 100% accuracy! Pure perfection!",
    'language-mastered': "🎓 Language mastered! Amazing work!",
  };

  return messages[milestone] || '🎉 Milestone achieved!';
}

