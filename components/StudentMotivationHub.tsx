import React from 'react';
import { useUserAchievements } from '../helpers/useGamification';
import { Skeleton } from './Skeleton';
import { Progress } from './Progress';
import { Badge } from './Badge';
import { AchievementSystem } from './AchievementSystem';
import { ReadingRewards } from './ReadingRewards';
import { Award, BookOpen, Target, Coins } from 'lucide-react';
import styles from './StudentMotivationHub.module.css';

const StatCard = ({ icon, title, value, total, unit, variant = 'primary' }: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  total?: number;
  unit?: string;
  variant?: 'primary' | 'secondary' | 'success';
}) => (
  <div className={`${styles.statCard} ${styles[variant]}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}>
      <p className={styles.statTitle}>{title}</p>
      <p className={styles.statValue}>
        {value}
        {total && <span className={styles.statTotal}> / {total}</span>}
        {unit && <span className={styles.statUnit}> {unit}</span>}
      </p>
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className={styles.statCard}>
    <Skeleton style={{ width: '40px', height: '40px', borderRadius: 'var(--radius)' }} />
    <div className={styles.statContent}>
      <Skeleton style={{ width: '100px', height: '1rem' }} />
      <Skeleton style={{ width: '60px', height: '1.5rem', marginTop: 'var(--spacing-1)' }} />
    </div>
  </div>
);

export const StudentMotivationHub = ({ className }: { className?: string }) => {
  const { data, isFetching, error } = useUserAchievements();

  const renderHeader = () => {
    if (isFetching) {
      return (
        <div className={styles.statsGrid}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      );
    }

    if (error) {
      return <div className={styles.error}>Could not load your progress. Please try again later.</div>;
    }

    if (!data) {
      return null;
    }

    return (
      <div className={styles.statsGrid}>
        <StatCard
          icon={<Award size={24} />}
          title="Achievements Unlocked"
          value={data.stats.unlockedCount}
          total={data.stats.totalAchievements}
          variant="primary"
        />
        <StatCard
          icon={<Target size={24} />}
          title="Overall Progress"
          value={`${Math.round(data.stats.completionPercentage)}%`}
          variant="success"
        />
        <StatCard
          icon={<BookOpen size={24} />}
          title="Next Goal"
          value="Read for 15 mins"
          variant="secondary"
        />
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Progress Hub</h1>
        <p className={styles.subtitle}>Keep up the great work! Here's how you're doing.</p>
      </header>
      
      <section className={styles.summarySection}>
        {renderHeader()}
      </section>

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <h2 className={styles.sectionTitle}>Your Achievements</h2>
          <AchievementSystem />
        </div>
        <div className={styles.rightColumn}>
          <h2 className={styles.sectionTitle}>Unlock Rewards</h2>
          <ReadingRewards />
        </div>
      </div>
    </div>
  );
};