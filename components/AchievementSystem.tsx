import React, { useState } from 'react';
import { useAchievements } from '../helpers/useGamification';
import { Skeleton } from './Skeleton';
import { Progress } from './Progress';
import { Badge } from './Badge';
import { Button } from './Button';
import { ProgressCelebration } from './ProgressCelebration';
import { Award, CheckCircle2, Gift, Share2 } from 'lucide-react';
import styles from './AchievementSystem.module.css';
import { AchievementWithProgress } from '../endpoints/gamification/achievements_GET.schema';

interface AchievementCardProps {
  achievement: AchievementWithProgress;
  onUnlock: (achievement: AchievementWithProgress) => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onUnlock }) => {
  const { name, description, category, pointsReward, isCompleted, progress } = achievement;

  const progressData =
    progress && typeof progress === 'object' && 'current' in progress && 'target' in progress
      ? { current: Number(progress.current), target: Number(progress.target) }
      : { current: isCompleted ? 1 : 0, target: 1 };

  const progressPercentage =
    progressData.target > 0 ? (progressData.current / progressData.target) * 100 : 0;

  React.useEffect(() => {
    if (isCompleted) {
      // This is a mock trigger. In a real app, a state change from an action (e.g., reading) would trigger this.
      // For demonstration, we can use a timeout to simulate an unlock.
      const wasCompleted = sessionStorage.getItem(`ach_${achievement.id}`) === 'true';
      if (!wasCompleted) {
        setTimeout(() => onUnlock(achievement), 500);
        sessionStorage.setItem(`ach_${achievement.id}`, 'true');
      }
    }
  }, [isCompleted, achievement, onUnlock]);

  return (
    <div className={`${styles.card} ${isCompleted ? styles.unlocked : ''}`}>
      <div className={styles.cardIcon}>
        {isCompleted ? <CheckCircle2 size={32} className={styles.unlockedIcon} /> : <Award size={32} className={styles.lockedIcon} />}
      </div>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{name}</h3>
          {pointsReward && pointsReward > 0 && (
            <Badge variant="secondary">
              <Gift size={12} />
              <span>{pointsReward} Points</span>
            </Badge>
          )}
        </div>
        <p className={styles.cardDescription}>{description}</p>
        {!isCompleted && (
          <div className={styles.progressContainer}>
            <Progress value={progressPercentage} />
            <span className={styles.progressText}>
              {progressData.current} / {progressData.target}
            </span>
          </div>
        )}
      </div>
      {isCompleted && (
        <Button variant="ghost" size="icon-sm" className={styles.shareButton} aria-label={`Share ${name} achievement`}>
          <Share2 size={16} />
        </Button>
      )}
    </div>
  );
};

const AchievementSkeleton: React.FC = () => (
  <div className={styles.card}>
    <div className={styles.cardIcon}>
      <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
    </div>
    <div className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <Skeleton style={{ width: '150px', height: '1.25rem' }} />
        <Skeleton style={{ width: '80px', height: '1.25rem', borderRadius: 'var(--radius-full)' }} />
      </div>
      <Skeleton style={{ width: '80%', height: '1rem', marginTop: 'var(--spacing-2)' }} />
      <div className={styles.progressContainer}>
        <Skeleton style={{ height: '0.5rem' }} />
        <Skeleton style={{ width: '50px', height: '1rem' }} />
      </div>
    </div>
  </div>
);

export const AchievementSystem = ({ className }: { className?: string }) => {
  const { data: achievements, isFetching, error } = useAchievements();
  const [celebratingAchievement, setCelebratingAchievement] = useState<AchievementWithProgress | null>(null);

  const handleUnlock = (achievement: AchievementWithProgress) => {
    setCelebratingAchievement(achievement);
  };

  const categories = React.useMemo(() => {
    if (!achievements) return {};
    return achievements.reduce((acc, ach) => {
      (acc[ach.category] = acc[ach.category] || []).push(ach);
      return acc;
    }, {} as Record<string, AchievementWithProgress[]>);
  }, [achievements]);

  const renderContent = () => {
    if (isFetching) {
      return (
        <>
          <Skeleton style={{ width: '200px', height: '2rem', marginBottom: 'var(--spacing-4)' }} />
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <AchievementSkeleton key={i} />)}
          </div>
        </>
      );
    }

    if (error) {
      return <div className={styles.error}>Failed to load achievements: {error.message}</div>;
    }

    if (!achievements || achievements.length === 0) {
      return <div className={styles.empty}>No achievements available yet. Keep reading!</div>;
    }

    return Object.entries(categories).map(([category, achs]) => (
      <section key={category} className={styles.categorySection}>
        <h2 className={styles.categoryTitle}>{category}</h2>
        <div className={styles.grid}>
          {achs.map((ach) => (
            <AchievementCard key={ach.id} achievement={ach} onUnlock={handleUnlock} />
          ))}
        </div>
      </section>
    ));
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {renderContent()}
      {celebratingAchievement && (
        <ProgressCelebration
          isOpen={!!celebratingAchievement}
          onClose={() => setCelebratingAchievement(null)}
          type="achievement"
          title={celebratingAchievement.name}
          message={`You've earned ${celebratingAchievement.pointsReward || 0} points!`}
        />
      )}
    </div>
  );
};