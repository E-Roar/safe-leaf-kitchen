import { logger } from '@/lib/logger';

export interface DailyStats {
  date: string; // YYYY-MM-DD format
  scans: number;
  chats: number;
  recipes_viewed: number;
  leaves_detected: Record<string, number>;
  timestamp: number;
}

export interface WeeklyStats {
  week: string; // YYYY-Www format (e.g., 2024-W01)
  total_scans: number;
  total_chats: number;
  total_recipes: number;
  most_detected_leaf: string;
  average_daily_scans: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  total_scans: number;
  total_chats: number;
  total_recipes: number;
  unique_leaves_detected: number;
  growth_percentage: number;
}

export class AnalyticsService {
  private static readonly STORAGE_PREFIX = 'safeleafkitchen_analytics';
  private static readonly MAX_DAILY_RECORDS = 90; // Keep 3 months of daily data


  // Track daily activity
  static recordScan(leafType?: string): void {
    const today = this.getToday();
    const dailyStats = this.getDailyStats(today);

    dailyStats.scans += 1;
    if (leafType) {
      dailyStats.leaves_detected[leafType] = (dailyStats.leaves_detected[leafType] || 0) + 1;
    }

    this.saveDailyStats(today, dailyStats);
  }

  static recordChat(): void {
    const today = this.getToday();
    const dailyStats = this.getDailyStats(today);

    dailyStats.chats += 1;
    this.saveDailyStats(today, dailyStats);
  }

  static recordRecipeView(): void {
    const today = this.getToday();
    const dailyStats = this.getDailyStats(today);

    dailyStats.recipes_viewed += 1;
    this.saveDailyStats(today, dailyStats);
  }

  // Get analytics data for charts
  static getDailyStatsRange(days: number = 30): DailyStats[] {
    const stats: DailyStats[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDate(date);

      const dayStats = this.getDailyStats(dateStr);
      stats.push(dayStats);
    }

    return stats;
  }

  static getWeeklyStatsRange(weeks: number = 12): WeeklyStats[] {
    const allDaily = this.getAllDailyStats();
    const weeklyMap = new Map<string, DailyStats[]>();

    // Group daily stats by week
    allDaily.forEach(daily => {
      const date = new Date(daily.date);
      const weekKey = this.getWeekKey(date);

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, []);
      }
      weeklyMap.get(weekKey)!.push(daily);
    });

    // Convert to weekly stats
    const weeklyStats: WeeklyStats[] = [];
    const sortedWeeks = Array.from(weeklyMap.keys()).sort().slice(-weeks);

    sortedWeeks.forEach(week => {
      const dailyStats = weeklyMap.get(week) || [];
      const weekly = this.aggregateToWeekly(week, dailyStats);
      weeklyStats.push(weekly);
    });

    return weeklyStats;
  }

  static getMonthlyStatsRange(months: number = 12): MonthlyStats[] {
    const allDaily = this.getAllDailyStats();
    const monthlyMap = new Map<string, DailyStats[]>();

    // Group daily stats by month
    allDaily.forEach(daily => {
      const date = new Date(daily.date);
      const monthKey = this.getMonthKey(date);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, []);
      }
      monthlyMap.get(monthKey)!.push(daily);
    });

    // Convert to monthly stats
    const monthlyStats: MonthlyStats[] = [];
    const sortedMonths = Array.from(monthlyMap.keys()).sort().slice(-months);

    sortedMonths.forEach((month, index) => {
      const dailyStats = monthlyMap.get(month) || [];
      const previousMonth = index > 0 ? monthlyMap.get(sortedMonths[index - 1]) || [] : [];
      const monthly = this.aggregateToMonthly(month, dailyStats, previousMonth);
      monthlyStats.push(monthly);
    });

    return monthlyStats;
  }

  // Get trend data for specific metrics
  static getScanTrend(days: number = 7): { date: string; value: number }[] {
    return this.getDailyStatsRange(days).map(stat => ({
      date: stat.date,
      value: stat.scans
    }));
  }

  static getChatTrend(days: number = 7): { date: string; value: number }[] {
    return this.getDailyStatsRange(days).map(stat => ({
      date: stat.date,
      value: stat.chats
    }));
  }

  static getLeafDetectionTrend(days: number = 7): Record<string, number | string>[] {
    const dailyStats = this.getDailyStatsRange(days);
    const allLeafTypes = new Set<string>();

    // Collect all leaf types
    dailyStats.forEach(stat => {
      Object.keys(stat.leaves_detected).forEach(leaf => allLeafTypes.add(leaf));
    });

    return dailyStats.map(stat => {
      const result: Record<string, number | string> = { date: stat.date };
      allLeafTypes.forEach(leaf => {
        result[leaf] = stat.leaves_detected[leaf] || 0;
      });
      return result;
    });
  }

  // Utility methods
  private static getToday(): string {
    return this.formatDate(new Date());
  }

  private static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  private static getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private static getDailyStats(date: string): DailyStats {
    const key = `${this.STORAGE_PREFIX}_daily_${date}`;
    const stored = this.getStorage<DailyStats>(key);

    if (stored) {
      return stored;
    }

    // Create new daily stats
    return {
      date,
      scans: 0,
      chats: 0,
      recipes_viewed: 0,
      leaves_detected: {},
      timestamp: Date.now()
    };
  }

  private static saveDailyStats(date: string, stats: DailyStats): void {
    const key = `${this.STORAGE_PREFIX}_daily_${date}`;
    stats.timestamp = Date.now();
    this.setStorage(key, stats);
  }

  private static getAllDailyStats(): DailyStats[] {
    const stats: DailyStats[] = [];
    const keys = this.getAllStorageKeys().filter(key => key.includes('_daily_'));

    keys.forEach(key => {
      const stored = this.getStorage<DailyStats>(key);
      if (stored) {
        stats.push(stored);
      }
    });

    return stats.sort((a, b) => a.date.localeCompare(b.date));
  }

  private static aggregateToWeekly(week: string, dailyStats: DailyStats[]): WeeklyStats {
    const total_scans = dailyStats.reduce((sum, day) => sum + day.scans, 0);
    const total_chats = dailyStats.reduce((sum, day) => sum + day.chats, 0);
    const total_recipes = dailyStats.reduce((sum, day) => sum + day.recipes_viewed, 0);

    // Find most detected leaf
    const leafCounts: Record<string, number> = {};
    dailyStats.forEach(day => {
      Object.entries(day.leaves_detected).forEach(([leaf, count]) => {
        leafCounts[leaf] = (leafCounts[leaf] || 0) + count;
      });
    });

    const most_detected_leaf = Object.entries(leafCounts).reduce((a, b) =>
      leafCounts[a[0]] > leafCounts[b[0]] ? a : b, ['none', 0])[0];

    return {
      week,
      total_scans,
      total_chats,
      total_recipes,
      most_detected_leaf,
      average_daily_scans: dailyStats.length > 0 ? total_scans / dailyStats.length : 0
    };
  }

  private static aggregateToMonthly(month: string, dailyStats: DailyStats[], previousMonthStats: DailyStats[]): MonthlyStats {
    const total_scans = dailyStats.reduce((sum, day) => sum + day.scans, 0);
    const total_chats = dailyStats.reduce((sum, day) => sum + day.chats, 0);
    const total_recipes = dailyStats.reduce((sum, day) => sum + day.recipes_viewed, 0);

    // Count unique leaves detected
    const uniqueLeaves = new Set<string>();
    dailyStats.forEach(day => {
      Object.keys(day.leaves_detected).forEach(leaf => uniqueLeaves.add(leaf));
    });

    // Calculate growth percentage
    const previous_scans = previousMonthStats.reduce((sum, day) => sum + day.scans, 0);
    const growth_percentage = previous_scans > 0 ?
      ((total_scans - previous_scans) / previous_scans) * 100 : 0;

    return {
      month,
      total_scans,
      total_chats,
      total_recipes,
      unique_leaves_detected: uniqueLeaves.size,
      growth_percentage
    };
  }

  private static getAllStorageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private static getStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  }

  private static setStorage<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Failed to write to localStorage: ${key}`, error);
      return false;
    }
  }

  // Cleanup old data
  static cleanup(): void {
    try {
      const allKeys = this.getAllStorageKeys();
      const dailyKeys = allKeys.filter(key => key.includes('_daily_')).sort();

      // Remove old daily records
      if (dailyKeys.length > this.MAX_DAILY_RECORDS) {
        const keysToRemove = dailyKeys.slice(0, dailyKeys.length - this.MAX_DAILY_RECORDS);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      logger.error('Failed to cleanup analytics data:', error);
    }
  }
}