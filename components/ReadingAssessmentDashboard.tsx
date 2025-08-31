import React, { useState } from 'react';
import { useAuth } from '../helpers/useAuth';
import { useProgressAnalytics } from '../helpers/useProgressAnalytics';
import { StudentProgressCard } from './StudentProgressCard';
import { AssessmentReports } from './AssessmentReports';
import { Skeleton } from './Skeleton';
import { AlertCircle } from 'lucide-react';
import styles from './ReadingAssessmentDashboard.module.css';

export const ReadingAssessmentDashboard = () => {
  const { authState } = useAuth();
  const { analytics, isLoading, error } = useProgressAnalytics();

  if (authState.type === 'loading' || isLoading) {
    return <DashboardSkeleton />;
  }

  if (authState.type === 'unauthenticated') {
    return (
      <div className={styles.centeredMessage}>
        <AlertCircle className={styles.icon} />
        <p>Please log in to view your assessment dashboard.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.centeredMessage} ${styles.error}`}>
        <AlertCircle className={styles.icon} />
        <p>Error loading progress data: {error.message}</p>
      </div>
    );
  }

  if (!analytics || analytics.totalMaterials === 0) {
    return (
      <div className={styles.centeredMessage}>
        <AlertCircle className={styles.icon} />
        <p>No reading progress found. Start reading to see your analytics!</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reading Assessment Dashboard</h1>
        <p className={styles.subtitle}>
          An overview of your reading journey and progress.
        </p>
      </header>
      <div className={styles.grid}>
        <div className={styles.mainContent}>
          <AssessmentReports analytics={analytics} />
        </div>
        <aside className={styles.sidebar}>
          <StudentProgressCard
            user={authState.type === 'authenticated' ? authState.user : undefined}
            analytics={analytics}
          />
        </aside>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className={styles.dashboard}>
    <header className={styles.header}>
      <Skeleton style={{ height: '2.5rem', width: '400px', marginBottom: 'var(--spacing-2)' }} />
      <Skeleton style={{ height: '1.25rem', width: '300px' }} />
    </header>
    <div className={styles.grid}>
      <div className={styles.mainContent}>
        {/* AssessmentReports Skeleton */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Skeleton style={{ height: '2rem', width: '250px' }} />
            <Skeleton style={{ height: '2.5rem', width: '180px' }} />
          </div>
          <div className={styles.cardGrid}>
            <Skeleton style={{ height: '150px' }} />
            <Skeleton style={{ height: '150px' }} />
            <Skeleton style={{ height: '150px' }} />
            <Skeleton style={{ height: '150px' }} />
          </div>
          <div className={styles.chartContainer}>
            <Skeleton style={{ height: '300px' }} />
          </div>
        </div>
      </div>
      <aside className={styles.sidebar}>
        {/* StudentProgressCard Skeleton */}
        <div className={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
            <Skeleton style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)' }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: '1.5rem', width: '80%' }} />
              <Skeleton style={{ height: '1rem', width: '60%', marginTop: 'var(--spacing-2)' }} />
            </div>
          </div>
          <Skeleton style={{ height: '1rem', width: '90%', marginBottom: 'var(--spacing-2)' }} />
          <Skeleton style={{ height: '1rem', width: '70%', marginBottom: 'var(--spacing-4)' }} />
          <Skeleton style={{ height: '2.5rem', width: '100%' }} />
        </div>
      </aside>
    </div>
  </div>
);