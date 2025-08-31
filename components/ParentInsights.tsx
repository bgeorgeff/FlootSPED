import React from 'react';
import { useParentChildInsights } from '../helpers/useParentDashboard';
import { Skeleton } from './Skeleton';
import { Lightbulb, Book, MessageSquareQuote, Frown } from 'lucide-react';
import styles from './ParentInsights.module.css';

interface Props {
  childId: number;
  className?: string;
}

export const ParentInsights = ({ childId, className }: Props) => {
  const { data, isFetching, error } = useParentChildInsights(childId);

  const renderLoadingState = () => (
    <div className={`${styles.card} ${className ?? ''}`}>
      <Skeleton style={{ height: '2rem', width: '180px', marginBottom: 'var(--spacing-4)' }} />
      <div className={styles.encouragement}>
        <Skeleton style={{ height: '1rem', width: '80%' }} />
        <Skeleton style={{ height: '1rem', width: '60%' }} />
      </div>
      <Skeleton style={{ height: '1.5rem', width: '220px', margin: 'var(--spacing-6) 0 var(--spacing-4) 0' }} />
      <div className={styles.recommendationItem}>
        <Skeleton style={{ height: '1rem', width: '150px' }} />
        <Skeleton style={{ height: '0.8rem', width: '250px' }} />
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
        <h3>Could not load insights</h3>
        <p>There was an issue fetching personalized insights.</p>
      </div>
    );
  }

  const { encouragement, recommendations } = data;

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <h2><Lightbulb size={20} /> Insights for You</h2>
      
      {encouragement && (
        <div className={styles.encouragement}>
          <MessageSquareQuote size={24} className={styles.quoteIcon} />
          <p>{encouragement}</p>
        </div>
      )}

      <div className={styles.recommendations}>
        <h3><Book size={18} /> Next Reads & Activities</h3>
        {recommendations.length > 0 ? (
          <ul className={styles.recommendationList}>
            {recommendations.map(rec => (
              <li key={rec.materialId} className={styles.recommendationItem}>
                <h4>{rec.title}</h4>
                <p>{rec.reason}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noRecommendations}>We're gathering data to provide new recommendations soon!</p>
        )}
      </div>
    </div>
  );
};