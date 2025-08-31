import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../helpers/User';
import { ProgressAnalytics } from '../helpers/useProgressAnalytics';
import { Progress } from './Progress';
import { Button } from './Button';
import { Badge } from './Badge';
import { BookOpen, Award, Clock } from 'lucide-react';
import styles from './StudentProgressCard.module.css';

interface StudentProgressCardProps {
  user?: User;
  analytics: ProgressAnalytics;
  className?: string;
}

export const StudentProgressCard = ({
  user,
  analytics,
  className,
}: StudentProgressCardProps) => {
  const {
    highestReadingLevel,
    totalMaterialsCompleted,
    averageReadingTime,
    completionRate,
  } = analytics;

  const formatLevel = (level: string) => {
    return level
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.profileHeader}>
        <img
          src={user?.avatarUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${user?.email || 'default'}`}
          alt={user?.displayName || 'User Avatar'}
          className={styles.avatar}
        />
        <div>
          <h3 className={styles.displayName}>{user?.displayName || 'Student'}</h3>
          <p className={styles.email}>{user?.email}</p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <BookOpen className={styles.statIcon} />
          <div>
            <p className={styles.statLabel}>Highest Level</p>
            <p className={styles.statValue}>
              {highestReadingLevel ? formatLevel(highestReadingLevel) : 'N/A'}
            </p>
          </div>
        </div>
        <div className={styles.statItem}>
          <Award className={styles.statIcon} />
          <div>
            <p className={styles.statLabel}>Completed</p>
            <p className={styles.statValue}>{totalMaterialsCompleted} Materials</p>
          </div>
        </div>
        <div className={styles.statItem}>
          <Clock className={styles.statIcon} />
          <div>
            <p className={styles.statLabel}>Avg. Time</p>
            <p className={styles.statValue}>{averageReadingTime.toFixed(1)} min</p>
          </div>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Overall Completion</span>
          <Badge variant="secondary">{completionRate.toFixed(0)}%</Badge>
        </div>
        <Progress value={completionRate} />
      </div>

      <Button asChild size="lg" className={styles.ctaButton}>
        <Link to="/library">Explore New Books</Link>
      </Button>
    </div>
  );
};