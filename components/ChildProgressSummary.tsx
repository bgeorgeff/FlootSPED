import React from 'react';
import { useParentChildInsights } from '../helpers/useParentDashboard';
import { ChildInfo } from '../endpoints/parent/children_GET.schema';
import { Skeleton } from './Skeleton';
import { Badge } from './Badge';
import { Progress } from './Progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './Chart';
import { BookOpen, Clock, Target, Frown } from 'lucide-react';
import styles from './ChildProgressSummary.module.css';

interface Props {
  childId: number;
  childInfo: ChildInfo;
  className?: string;
}

const readingLevelText: Record<string, string> = {
  kindergarten: 'Kindergarten',
  first_grade: '1st Grade',
  second_grade: '2nd Grade',
  third_grade: '3rd Grade',
  fourth_grade: '4th Grade',
  fifth_grade: '5th Grade',
};

export const ChildProgressSummary = ({ childId, childInfo, className }: Props) => {
  const { data, isFetching, error } = useParentChildInsights(childId);

  const renderLoadingState = () => (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <Skeleton style={{ height: '2rem', width: '200px' }} />
        <Skeleton style={{ height: '1.5rem', width: '100px' }} />
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <Skeleton style={{ height: '1.5rem', width: '80px' }} />
          <Skeleton style={{ height: '1rem', width: '120px' }} />
        </div>
        <div className={styles.statItem}>
          <Skeleton style={{ height: '1.5rem', width: '80px' }} />
          <Skeleton style={{ height: '1rem', width: '120px' }} />
        </div>
        <div className={styles.statItem}>
          <Skeleton style={{ height: '1.5rem', width: '80px' }} />
          <Skeleton style={{ height: '1rem', width: '120px' }} />
        </div>
      </div>
      <div className={styles.chartContainer}>
        <Skeleton style={{ height: '200px', width: '100%' }} />
      </div>
    </div>
  );

  if (isFetching) {
    return renderLoadingState();
  }

  if (error || !data || 'error' in data) {
    return (
      <div className={`${styles.card} ${styles.centeredMessage} ${className ?? ''}`}>
        <Frown className={styles.icon} />
        <h3>Could not load progress</h3>
        <p>There was an issue fetching the progress summary.</p>
      </div>
    );
  }

  const { weeklySummary, monthlySummary, totalMaterialsCompleted } = data;

  const chartData = [
    { name: 'This Week', minutes: weeklySummary.minutesRead },
    { name: 'This Month', minutes: monthlySummary.minutesRead },
  ];

  const chartConfig = {
    minutes: {
      label: 'Minutes Read',
      color: 'var(--chart-color-1)',
    },
  };

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <h2>{childInfo.displayName}'s Progress</h2>
        {childInfo.currentReadingLevel && (
          <Badge variant="secondary">
            {readingLevelText[childInfo.currentReadingLevel] || childInfo.currentReadingLevel}
          </Badge>
        )}
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <Clock size={16} className={styles.statIcon} />
            <span>Time Read (Weekly)</span>
          </div>
          <p className={styles.statValue}>{weeklySummary.minutesRead} min</p>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <BookOpen size={16} className={styles.statIcon} />
            <span>Sessions (Weekly)</span>
          </div>
          <p className={styles.statValue}>{weeklySummary.sessions}</p>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statHeader}>
            <Target size={16} className={styles.statIcon} />
            <span>Materials Completed</span>
          </div>
          <p className={styles.statValue}>{totalMaterialsCompleted}</p>
        </div>
      </div>
      <div className={styles.chartSection}>
        <h3>Reading Time Comparison</h3>
        <div className={styles.chartContainer}>
          <ChartContainer config={chartConfig}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis unit="m" width={30} tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};