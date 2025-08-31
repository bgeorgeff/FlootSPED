import { useMemo } from 'react';
import { useUserProgress } from './useReadingProgress';
import { UserProgress } from '../endpoints/reading/progress_GET.schema';
import { ReadingLevel, ReadingLevelArrayValues } from './schema';

export interface ProgressAnalytics {
  // Overview Metrics
  totalMaterials: number;
  totalMaterialsCompleted: number;
  completionRate: number;
  totalReadingTime: number; // in minutes
  averageReadingTime: number; // in minutes
  totalWordsClicked: number;
  highestReadingLevel: ReadingLevel | null;

  // Chart Data
  completionByLevel: { level: string; completed: number; total: number; rate: number }[];
  readingTimeByMonth: { month: string; time: number }[];
  wordsClickedByMonth: { month: string; words: number }[];
}

const READING_LEVEL_ORDER: Record<ReadingLevel, number> = {
  kindergarten: 0,
  first_grade: 1,
  second_grade: 2,
  third_grade: 3,
  fourth_grade: 4,
  fifth_grade: 5,
};

const formatLevel = (level: string) => {
  return level
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const useProgressAnalytics = () => {
  const { data: progressData, isFetching, error } = useUserProgress();

  const analytics = useMemo<ProgressAnalytics | null>(() => {
    if (!progressData || progressData.length === 0) {
      return null;
    }

    const totalMaterials = progressData.length;
    const completedProgress = progressData.filter((p) => p.completedAt !== null);
    const totalMaterialsCompleted = completedProgress.length;
    const completionRate = totalMaterials > 0 ? (totalMaterialsCompleted / totalMaterials) * 100 : 0;

    const totalReadingTimeSeconds = progressData.reduce((sum, p) => sum + (p.readingTimeSeconds || 0), 0);
    const totalReadingTime = totalReadingTimeSeconds / 60;
    const averageReadingTime = totalMaterials > 0 ? totalReadingTime / totalMaterials : 0;

    const totalWordsClicked = progressData.reduce((sum, p) => sum + (p.wordsClickedCount || 0), 0);

    const highestReadingLevel = completedProgress.length > 0
      ? completedProgress.reduce((highest, current) => {
          if (!highest) return current.readingLevel;
          return READING_LEVEL_ORDER[current.readingLevel] > READING_LEVEL_ORDER[highest]
            ? current.readingLevel
            : highest;
        }, null as ReadingLevel | null)
      : null;

    // Completion by Level
    const levelCounts = progressData.reduce((acc, p) => {
      acc[p.readingLevel] = acc[p.readingLevel] || { total: 0, completed: 0 };
      acc[p.readingLevel].total++;
      if (p.completedAt) {
        acc[p.readingLevel].completed++;
      }
      return acc;
    }, {} as Record<ReadingLevel, { total: number; completed: number }>);

    const completionByLevel = ReadingLevelArrayValues.sort((a, b) => READING_LEVEL_ORDER[a] - READING_LEVEL_ORDER[b]).map((level) => {
      const data = levelCounts[level] || { total: 0, completed: 0 };
      return {
        level: formatLevel(level),
        completed: data.completed,
        total: data.total,
        rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      };
    }).filter(item => item.total > 0);

    // Data by Month
    const monthlyData: Record<string, { time: number; words: number }> = {};
    const monthFormatter = new Intl.DateTimeFormat('en-US', { year: '2-digit', month: 'short' });

    progressData.forEach((p) => {
      const date = p.updatedAt || p.startedAt;
      if (date) {
        const monthKey = monthFormatter.format(new Date(date));
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { time: 0, words: 0 };
        }
        monthlyData[monthKey].time += (p.readingTimeSeconds || 0) / 60;
        monthlyData[monthKey].words += p.wordsClickedCount || 0;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(`01-${a.replace("'", "-")}`);
        const dateB = new Date(`01-${b.replace("'", "-")}`);
        return dateA.getTime() - dateB.getTime();
    });

    const readingTimeByMonth = sortedMonths.map((month) => ({
      month,
      time: Math.round(monthlyData[month].time),
    }));

    const wordsClickedByMonth = sortedMonths.map((month) => ({
      month,
      words: monthlyData[month].words,
    }));

    return {
      totalMaterials,
      totalMaterialsCompleted,
      completionRate,
      totalReadingTime,
      averageReadingTime,
      totalWordsClicked,
      highestReadingLevel,
      completionByLevel,
      readingTimeByMonth,
      wordsClickedByMonth,
    };
  }, [progressData]);

  return {
    analytics,
    isLoading: isFetching,
    error: error instanceof Error ? error : null,
  };
};