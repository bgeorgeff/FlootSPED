import React, { useState, useMemo } from 'react';
import { useParentChildren } from '../helpers/useParentDashboard';
import { ChildProgressSummary } from './ChildProgressSummary';
import { ReadingStreakTracker } from './ReadingStreakTracker';
import { ParentInsights } from './ParentInsights';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { User, Smile, Frown } from 'lucide-react';
import styles from './ParentDashboard.module.css';

export const ParentDashboard = ({ className }: { className?: string }) => {
  const { data: childrenData, isFetching, error } = useParentChildren();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const children = childrenData && 'children' in childrenData ? childrenData.children : [];

  // Effect to set the selected child once data is loaded
  React.useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(() => {
    return children.find(c => c.id === selectedChildId) || null;
  }, [children, selectedChildId]);

  const renderLoadingState = () => (
    <div className={styles.container}>
      <div className={styles.header}>
        <Skeleton style={{ height: '2.5rem', width: '200px' }} />
        <div className={styles.childSelector}>
          <Skeleton style={{ height: '2.5rem', width: '100px', borderRadius: 'var(--radius-full)' }} />
          <Skeleton style={{ height: '2.5rem', width: '100px', borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.mainContent}>
          <Skeleton style={{ height: '250px', width: '100%' }} />
          <Skeleton style={{ height: '200px', width: '100%' }} />
        </div>
        <div className={styles.sidebar}>
          <Skeleton style={{ height: '300px', width: '100%' }} />
        </div>
      </div>
    </div>
  );

  if (isFetching && !childrenData) {
    return renderLoadingState();
  }

  if (error) {
    return (
      <div className={`${styles.container} ${styles.centeredMessage} ${className ?? ''}`}>
        <Frown className={styles.icon} />
        <h2>Oops! Something went wrong.</h2>
        <p>We couldn't load the dashboard data. Please try again later.</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className={`${styles.container} ${styles.centeredMessage} ${className ?? ''}`}>
        <Smile className={styles.icon} />
        <h2>Welcome!</h2>
        <p>It looks like you don't have any children linked to your account yet.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <header className={styles.header}>
        <h1>Parent Dashboard</h1>
        {children.length > 1 && (
          <div className={styles.childSelector} role="tablist" aria-label="Select a child">
            {children.map(child => (
              <Button
                key={child.id}
                variant={selectedChildId === child.id ? 'primary' : 'ghost'}
                onClick={() => setSelectedChildId(child.id)}
                className={styles.childButton}
                role="tab"
                aria-selected={selectedChildId === child.id}
              >
                {child.avatarUrl ? (
                  <img src={child.avatarUrl} alt={`${child.displayName}'s avatar`} className={styles.avatar} />
                ) : (
                  <User size={16} />
                )}
                {child.displayName}
              </Button>
            ))}
          </div>
        )}
      </header>

      {selectedChildId && selectedChild && (
        <div className={styles.grid}>
          <div className={styles.mainContent}>
            <ChildProgressSummary childId={selectedChildId} childInfo={selectedChild} />
            <ParentInsights childId={selectedChildId} />
          </div>
          <aside className={styles.sidebar}>
            <ReadingStreakTracker childId={selectedChildId} />
          </aside>
        </div>
      )}
    </div>
  );
};