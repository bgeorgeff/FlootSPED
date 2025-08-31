import React from 'react';
import { useParentChildStreak } from '../helpers/useParentDashboard';
import { Skeleton } from './Skeleton';
import { Flame, Star, Trophy, Frown } from 'lucide-react';
import styles from './ReadingStreakTracker.module.css';

interface Props {
  childId: number;
  className?: string;
}

export const ReadingStreakTracker = ({ childId, className }: Props) => {
  const { data, isFetching, error } = useParentChildStreak(childId);

  const renderLoadingState = () => (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.streakInfo}>
        <Skeleton style={{ height: '4rem', width: '4rem', borderRadius: '50%' }} />
        <div className={styles.streakText}>
          <Skeleton style={{ height: '1.5rem', width: '150px' }} />
          <Skeleton style={{ height: '1rem', width: '100px' }} />
        </div>
      </div>
      <div className={styles.longestStreak}>
        <Skeleton style={{ height: '1rem', width: '120px' }} />
      </div>
      <div className={styles.achievements}>
        <Skeleton style={{ height: '1.5rem', width: '100px', marginBottom: 'var(--spacing-4)' }} />
        <div className={styles.achievementItem}>
          <Skeleton style={{ height: '2.5rem', width: '2.5rem', borderRadius: '50%' }} />
          <div className={styles.achievementDetails}>
            <Skeleton style={{ height: '1rem', width: '120px' }} />
            <Skeleton style={{ height: '0.8rem', width: '180px' }} />
          </div>
        </div>
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
        <h3>Could not load streak</h3>
        <p>There was an issue fetching streak and achievement data.</p>
      </div>
    );
  }

  const { currentStreak, longestStreak, achievements } = data;

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.streakInfo}>
        <div className={styles.flameIcon}>
          <Flame size={40} />
        </div>
        <div className={styles.streakText}>
          <span className={styles.streakValue}>{currentStreak} Day{currentStreak !== 1 && 's'}</span>
          <span className={styles.streakLabel}>Reading Streak!</span>
        </div>
      </div>
      <div className={styles.longestStreak}>
        <Trophy size={16} />
        <span>Longest Streak: {longestStreak} days</span>
      </div>
      <div className={styles.achievements}>
        <h3><Star size={18} /> Recent Achievements</h3>
        {achievements.length > 0 ? (
          <ul className={styles.achievementList}>
            {achievements.slice(0, 3).map((ach, index) => (
              <li key={index} className={styles.achievementItem}>
                <img src={ach.iconUrl} alt={`${ach.name} badge`} className={styles.achievementIcon} />
                <div className={styles.achievementDetails}>
                  <h4>{ach.name}</h4>
                  <p>{ach.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noAchievements}>No new achievements yet. Keep reading!</p>
        )}
      </div>
    </div>
  );
};